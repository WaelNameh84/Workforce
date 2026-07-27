import { Attendance, Leave, WorkRequest, Payroll, Employee } from '@workspace/api-client-react';

export interface RateResult {
  dailyRate: number;
  hourlyRate: number;
  minuteRate: number;
  secondRate: number;
}

export function calcRates(
  basicSalary: number,
  workDaysPerMonth: number,
  dailyHoursScheduled: number
): RateResult {
  const dailyRate = workDaysPerMonth > 0 ? basicSalary / workDaysPerMonth : 0;
  const hourlyRate = dailyHoursScheduled > 0 ? dailyRate / dailyHoursScheduled : 0;
  const minuteRate = hourlyRate / 60;
  const secondRate = minuteRate / 60;

  return { dailyRate, hourlyRate, minuteRate, secondRate };
}

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

export function calcWorkedTime(
  attendanceRows: Attendance[],
  workStart: string,
  workEnd: string,
  breakMin: number,
  lateGrace: number = 0,
  otThreshold: number = 0
) {
  let workedSeconds = 0;
  let lateMinutesTotal = 0;
  let earlyMinutesTotal = 0;
  let overtimeMinutesTotal = 0;
  let workedDaysCount = 0;
  let absentDaysCount = 0;

  const startMin = parseTimeToMinutes(workStart);
  const endMin = parseTimeToMinutes(workEnd);

  attendanceRows.forEach((row) => {
    if (row.status === 'absent') {
      absentDaysCount++;
      return;
    }

    if (!row.clockIn) return;
    workedDaysCount++;

    const inDate = new Date(row.clockIn);
    const inMin = inDate.getHours() * 60 + inDate.getMinutes();

    let outMin = endMin;
    let outDate = inDate;
    if (row.clockOut) {
      outDate = new Date(row.clockOut);
      outMin = outDate.getHours() * 60 + outDate.getMinutes();
    }

    // Calculate exact duration
    let durationSeconds = (outDate.getTime() - inDate.getTime()) / 1000;
    
    // subtract break
    durationSeconds = Math.max(0, durationSeconds - (breakMin * 60));
    workedSeconds += durationSeconds;

    // Late calculation
    if (inMin > startMin + lateGrace) {
      lateMinutesTotal += (inMin - startMin);
    }

    // Early calculation
    if (outMin < endMin && row.clockOut) {
      earlyMinutesTotal += (endMin - outMin);
    }

    // Overtime calculation
    if (outMin > endMin + otThreshold) {
      overtimeMinutesTotal += (outMin - endMin);
    }
  });

  return {
    workedDays: workedDaysCount,
    absentDays: absentDaysCount,
    workedSeconds: Math.floor(workedSeconds),
    workedMinutes: Math.floor(workedSeconds / 60),
    workedHours: Math.floor((workedSeconds / 3600) * 10) / 10,
    lateMinutes: lateMinutesTotal,
    earlyMinutes: earlyMinutesTotal,
    overtimeHours: Math.floor((overtimeMinutesTotal / 60) * 10) / 10,
  };
}

export interface LeaveCalcResult {
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  sickPaidDays: number;
  sickUnpaidDays: number;
}

export function calcLeaveDeductions(
  leaveRows: Leave[],
  periodPrefix: string // e.g. "2023-10"
): LeaveCalcResult {
  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;
  let sickPaidDays = 0;
  let sickUnpaidDays = 0;

  leaveRows.forEach((leave) => {
    if (leave.status !== 'approved') return;
    if (!leave.startDate?.startsWith(periodPrefix)) return; // naive check for simplicity

    const days = leave.daysCount || 0;
    
    if (leave.type === 'unpaid') {
      unpaidLeaveDays += days;
    } else if (leave.type === 'sick') {
      // simplified: assume first 3 days paid, rest unpaid or based on policy
      // We'll just assume all sick are paid for now unless marked otherwise.
      sickPaidDays += days; 
    } else {
      paidLeaveDays += days;
    }
  });

  return { paidLeaveDays, unpaidLeaveDays, sickPaidDays, sickUnpaidDays };
}

export interface PayrollConfig {
  workDaysPerMonth: number;
  dailyHoursScheduled: number;
  workStart: string;
  workEnd: string;
  breakMin: number;
  lateGrace: number;
  otThreshold: number;
  overtimeMultiplier: number;
  lateDeductMultiplier: number;
}

export interface EmployeePaySummary extends Omit<Payroll, 'id'> {
  employeeId: number;
}

export function buildPayrollSummary(
  employee: Employee,
  attendanceRows: Attendance[],
  leaveRows: Leave[],
  requestRows: WorkRequest[],
  existingPayroll: Payroll | null,
  period: string,
  cfg: PayrollConfig
): EmployeePaySummary {
  // 1. Employee Basics
  const contractType = (employee.contractType || 'monthly') as any;
  const basicSalary = parseFloat(employee.salary || '0') || 0;
  
  // 2. Rates
  const rates = calcRates(basicSalary, cfg.workDaysPerMonth, cfg.dailyHoursScheduled);
  
  // 3. Time Metrics
  const time = calcWorkedTime(
    attendanceRows, 
    employee.workStart || cfg.workStart, 
    employee.workEnd || cfg.workEnd, 
    cfg.breakMin, 
    cfg.lateGrace, 
    cfg.otThreshold
  );

  // 4. Leave Metrics
  const leaves = calcLeaveDeductions(leaveRows, period);

  // 5. Calculate Deductions & Additions (base logic)
  let lateDeduction = time.lateMinutes * rates.minuteRate * cfg.lateDeductMultiplier;
  let earlyDeduction = time.earlyMinutes * rates.minuteRate * cfg.lateDeductMultiplier;
  let absenceDeduction = time.absentDays * rates.dailyRate;
  let unpaidLeaveDeduction = (leaves.unpaidLeaveDays + leaves.sickUnpaidDays) * rates.dailyRate;
  
  let overtimePay = time.overtimeHours * rates.hourlyRate * cfg.overtimeMultiplier;

  // Merge with existing overrides
  let bonus = 0;
  let allowances = 0;
  let commissions = 0;
  let advances = 0;
  let fines = 0;
  let taxRate = 0;
  let insuranceRate = 0;
  let notes = '';
  let status = 'draft' as any;

  if (existingPayroll) {
    bonus = parseFloat(existingPayroll.bonus || '0') || 0;
    allowances = parseFloat(existingPayroll.allowances || '0') || 0;
    commissions = parseFloat(existingPayroll.commissions || '0') || 0;
    advances = parseFloat(existingPayroll.advances || '0') || 0;
    fines = parseFloat(existingPayroll.fines || '0') || 0;
    taxRate = parseFloat(existingPayroll.tax || '0') || 0;
    insuranceRate = parseFloat(existingPayroll.insurance || '0') || 0;
    notes = existingPayroll.notes || '';
    if (existingPayroll.status) status = existingPayroll.status;
  }

  // Adjust for contract types
  let actualBasic = basicSalary;
  if (contractType === 'daily') {
    actualBasic = time.workedDays * rates.dailyRate;
    absenceDeduction = 0;
  } else if (contractType === 'hourly') {
    actualBasic = time.workedHours * rates.hourlyRate;
    absenceDeduction = 0;
    lateDeduction = 0;
    earlyDeduction = 0;
  }

  const grossSalary = actualBasic + overtimePay + bonus + allowances + commissions;
  
  const taxDeduction = grossSalary * (taxRate / 100);
  const insuranceDeduction = grossSalary * (insuranceRate / 100);
  
  const baseDeductions = lateDeduction + earlyDeduction + absenceDeduction + unpaidLeaveDeduction;
  const manualDeductions = advances + fines + taxDeduction + insuranceDeduction;
  const totalDeductions = baseDeductions + manualDeductions;
  
  const totalEarnings = grossSalary;
  const netSalary = Math.max(0, totalEarnings - totalDeductions);

  return {
    employeeId: employee.id!,
    employeeName: employee.fullName,
    departmentName: employee.departmentName,
    period,
    contractType,
    workDaysPerMonth: cfg.workDaysPerMonth,
    dailyHoursScheduled: cfg.dailyHoursScheduled.toString(),
    basicSalary: actualBasic.toFixed(2),
    dailyRate: rates.dailyRate.toFixed(2),
    hourlyRate: rates.hourlyRate.toFixed(2),
    minuteRate: rates.minuteRate.toFixed(4),
    secondRate: rates.secondRate.toFixed(6),
    workedDays: time.workedDays.toString(),
    workedHours: time.workedHours.toString(),
    workedMinutes: time.workedMinutes.toString(),
    workedSeconds: time.workedSeconds.toString(),
    absentDays: time.absentDays.toString(),
    lateMinutes: time.lateMinutes.toString(),
    earlyMinutes: time.earlyMinutes.toString(),
    overtimeHours: time.overtimeHours.toString(),
    overtimeRate: cfg.overtimeMultiplier.toString(),
    overtime: overtimePay.toFixed(2),
    bonus: bonus.toFixed(2),
    allowances: allowances.toFixed(2),
    commissions: commissions.toFixed(2),
    grossSalary: grossSalary.toFixed(2),
    lateDeduction: lateDeduction.toFixed(2),
    absenceDeduction: absenceDeduction.toFixed(2),
    advances: advances.toFixed(2),
    fines: fines.toFixed(2),
    deductions: baseDeductions.toFixed(2), // store base deductions here
    tax: taxRate.toString(),
    insurance: insuranceRate.toString(),
    totalEarnings: totalEarnings.toFixed(2),
    totalDeductions: totalDeductions.toFixed(2),
    netSalary: netSalary.toFixed(2),
    paidLeaveDays: leaves.paidLeaveDays.toString(),
    unpaidLeaveDays: leaves.unpaidLeaveDays.toString(),
    notes,
    status,
  };
}

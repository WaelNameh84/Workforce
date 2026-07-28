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

export interface WorkedTimeResult {
  workedDays: number;
  absentDays: number;
  workedSeconds: number;
  workedMinutes: number;
  workedHours: number;
  lateMinutes: number;
  earlyMinutes: number;
  /** Regular overtime hours (weekday, within normal multiplier) */
  overtimeHours: number;
  /** Overtime hours that fall on weekend days */
  weekendOvertimeHours: number;
  /** Night-shift hours worked between nightStart and nightEnd */
  nightHours: number;
  /** Days where worked hours >= scheduled daily hours (count as full day) */
  fullDays: number;
  /** Hours worked on days where total < scheduled daily hours (paid at hourly rate) */
  partialHours: number;
}

export function calcWorkedTime(
  attendanceRows: Attendance[],
  workStart: string,
  workEnd: string,
  breakMin: number,
  lateGrace: number = 0,
  otThreshold: number = 0,
  /** Weekend day numbers: 0=Sun,1=Mon,5=Fri,6=Sat. Default [5,6] (Fri/Sat) */
  weekendDays: number[] = [5, 6],
  /** Night shift start hour (24h). Default 22 */
  nightStartHour: number = 22,
  /** Night shift end hour (24h). Default 6 */
  nightEndHour: number = 6,
  /** Scheduled working hours per day (used to distinguish full vs partial days) */
  dailyHoursScheduled: number = 8
): WorkedTimeResult {
  let workedSeconds = 0;
  let lateMinutesTotal = 0;
  let earlyMinutesTotal = 0;
  let overtimeMinutesTotal = 0;
  let weekendOvertimeMinutesTotal = 0;
  let nightMinutesTotal = 0;
  let workedDaysCount = 0;
  let absentDaysCount = 0;
  let fullDaysCount = 0;
  let partialHoursTotal = 0;

  const startMin = parseTimeToMinutes(workStart);
  const endMin = parseTimeToMinutes(workEnd);
  const scheduledSeconds = dailyHoursScheduled * 3600;

  attendanceRows.forEach((row) => {
    if (row.status === 'absent') {
      absentDaysCount++;
      return;
    }

    if (!row.clockIn) return;
    workedDaysCount++;

    const inDate = new Date(row.clockIn);
    const inMin = inDate.getHours() * 60 + inDate.getMinutes();
    const dayOfWeek = inDate.getDay();
    const isWeekend = weekendDays.includes(dayOfWeek);

    let outMin = endMin;
    let outDate = inDate;
    if (row.clockOut) {
      outDate = new Date(row.clockOut);
      outMin = outDate.getHours() * 60 + outDate.getMinutes();
    }

    // Exact duration minus break
    let durationSeconds = (outDate.getTime() - inDate.getTime()) / 1000;
    durationSeconds = Math.max(0, durationSeconds - breakMin * 60);
    workedSeconds += durationSeconds;

    // Full day vs partial day — compare net worked seconds to scheduled
    if (durationSeconds >= scheduledSeconds) {
      fullDaysCount++;
    } else {
      // Partial day: accumulate hours worked (will be paid at hourly rate)
      partialHoursTotal += durationSeconds / 3600;
    }

    // Late
    if (inMin > startMin + lateGrace) {
      lateMinutesTotal += inMin - startMin;
    }

    // Early leave
    if (outMin < endMin && row.clockOut) {
      earlyMinutesTotal += endMin - outMin;
    }

    // Overtime
    if (outMin > endMin + otThreshold) {
      const otMin = outMin - endMin;
      if (isWeekend) {
        weekendOvertimeMinutesTotal += otMin;
      } else {
        overtimeMinutesTotal += otMin;
      }
    }

    // Night hours: count minutes within [nightStartHour, 24) ∪ [0, nightEndHour)
    const startHour = inDate.getHours();
    const endHour = outDate.getHours();
    for (let h = startHour; h < endHour + 1; h++) {
      const normalizedH = h % 24;
      if (normalizedH >= nightStartHour || normalizedH < nightEndHour) {
        nightMinutesTotal += 60;
      }
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
    weekendOvertimeHours: Math.floor((weekendOvertimeMinutesTotal / 60) * 10) / 10,
    nightHours: Math.floor((nightMinutesTotal / 60) * 10) / 10,
    fullDays: fullDaysCount,
    partialHours: Math.floor(partialHoursTotal * 100) / 100,
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
  periodPrefix: string
): LeaveCalcResult {
  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;
  let sickPaidDays = 0;
  let sickUnpaidDays = 0;

  leaveRows.forEach((leave) => {
    if (leave.status !== 'approved') return;
    if (!leave.startDate?.startsWith(periodPrefix)) return;

    const days = leave.daysCount || 0;

    if (leave.type === 'unpaid') {
      unpaidLeaveDays += days;
    } else if (leave.type === 'sick') {
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
  /** Weekday overtime multiplier (e.g. 1.5 = 150%) */
  overtimeMultiplier: number;
  /** Weekend overtime multiplier (e.g. 2.0 = 200%) */
  overtimeWeekendMultiplier: number;
  /** Night shift differential multiplier (extra on top of hourly, e.g. 0.25 = 25% extra) */
  nightDifferential: number;
  lateDeductMultiplier: number;
  /** Weekend day numbers: 0=Sun … 6=Sat. Default [5,6] */
  weekendDays: number[];
  /** Night start hour (24h). Default 22 */
  nightStartHour: number;
  /** Night end hour (24h). Default 6 */
  nightEndHour: number;
  /** Default monthly loan installment; per-employee value comes from payroll metadata */
  installmentAmount: number;
}

export interface EmployeePaySummary extends Omit<Payroll, 'id'> {
  employeeId: number;
  /** Weekday overtime hours */
  weekdayOvertimeHours?: number;
  /** Weekend overtime hours */
  weekendOvertimeHours?: number;
  /** Night shift hours */
  nightHours?: number;
  /** Weekend overtime pay */
  weekendOvertimePay?: number;
  /** Night shift differential pay */
  nightDifferentialPay?: number;
  /** Monthly loan installment deduction for display/edit in modal */
  installmentAmount?: number;
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
  const contractType = (employee.contractType || 'monthly') as any;
  const basicSalary = parseFloat(employee.salary || '0') || 0;

  const rates = calcRates(basicSalary, cfg.workDaysPerMonth, cfg.dailyHoursScheduled);

  const time = calcWorkedTime(
    attendanceRows,
    employee.workStart || cfg.workStart,
    employee.workEnd || cfg.workEnd,
    cfg.breakMin,
    cfg.lateGrace,
    cfg.otThreshold,
    cfg.weekendDays,
    cfg.nightStartHour,
    cfg.nightEndHour,
    cfg.dailyHoursScheduled
  );

  const leaves = calcLeaveDeductions(leaveRows, period);

  // Deduction components
  let lateDeductionAmt = time.lateMinutes * rates.minuteRate * cfg.lateDeductMultiplier;
  let earlyDeductionAmt = time.earlyMinutes * rates.minuteRate * cfg.lateDeductMultiplier;
  let absenceDeduction = time.absentDays * rates.dailyRate;
  let unpaidLeaveDeduction = (leaves.unpaidLeaveDays + leaves.sickUnpaidDays) * rates.dailyRate;

  // Multi-rate overtime
  const weekdayOvertimePay = time.overtimeHours * rates.hourlyRate * cfg.overtimeMultiplier;
  const weekendOvertimePay = time.weekendOvertimeHours * rates.hourlyRate * cfg.overtimeWeekendMultiplier;
  const nightDifferentialPay = time.nightHours * rates.hourlyRate * cfg.nightDifferential;
  const overtimePay = weekdayOvertimePay + weekendOvertimePay;

  // Manual overrides from existing payroll record
  let bonus = 0;
  let allowances = 0;
  let commissions = 0;
  let advances = 0;
  let fines = 0;
  let taxRate = 0;
  let insuranceRate = 0;
  let notes = '';
  let status = 'draft' as any;
  // Installment: read from per-payroll metadata
  let installmentAmount =
    (existingPayroll as any)?.metadata?.installmentAmount ?? cfg.installmentAmount ?? 0;

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
    // Overwrite installment if stored in advances field (legacy) — no, keep separate
    if ((existingPayroll as any)?.metadata?.installmentAmount !== undefined) {
      installmentAmount = (existingPayroll as any).metadata.installmentAmount;
    }
  }

  // Contract-type adjustments
  let actualBasic = basicSalary;
  let partialDayPay = 0;
  if (contractType === 'daily') {
    // Daily: pay per worked day only
    actualBasic = time.workedDays * rates.dailyRate;
    absenceDeduction = 0;
  } else if (contractType === 'hourly') {
    // Hourly: pay per worked hour only
    actualBasic = time.workedHours * rates.hourlyRate;
    absenceDeduction = 0;
    lateDeductionAmt = 0;
    earlyDeductionAmt = 0;
  } else {
    // Monthly hybrid:
    //   • Full days (worked hours >= scheduled hours) → paid at daily rate
    //   • Partial days (worked hours < scheduled hours) → paid at hourly rate
    //   • Days with no record and absent days → not paid (already excluded)
    actualBasic = time.fullDays * rates.dailyRate;
    partialDayPay = time.partialHours * rates.hourlyRate;
    // Absence and unpaid leave are already excluded (not in fullDays/partialHours)
    absenceDeduction = 0;
    unpaidLeaveDeduction = 0;
  }

  const grossSalary = actualBasic + partialDayPay + overtimePay + nightDifferentialPay + bonus + allowances + commissions;

  const taxDeduction = grossSalary * (taxRate / 100);
  const insuranceDeduction = grossSalary * (insuranceRate / 100);

  // lateDeduction in DB = late + early combined (no separate earlyDeduction column)
  const combinedLateDeduction = lateDeductionAmt + earlyDeductionAmt;
  const baseDeductions = combinedLateDeduction + absenceDeduction + unpaidLeaveDeduction;
  const manualDeductions = advances + fines + installmentAmount + taxDeduction + insuranceDeduction;
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
    overtimeHours: (time.overtimeHours + time.weekendOvertimeHours).toString(),
    overtimeRate: cfg.overtimeMultiplier.toString(),
    overtime: overtimePay.toFixed(2),
    bonus: bonus.toFixed(2),
    allowances: allowances.toFixed(2),
    commissions: commissions.toFixed(2),
    grossSalary: grossSalary.toFixed(2),
    lateDeduction: combinedLateDeduction.toFixed(2), // late + early combined
    absenceDeduction: absenceDeduction.toFixed(2),
    advances: advances.toFixed(2),
    fines: fines.toFixed(2),
    deductions: baseDeductions.toFixed(2),
    tax: taxRate.toString(),
    insurance: insuranceRate.toString(),
    totalEarnings: totalEarnings.toFixed(2),
    totalDeductions: totalDeductions.toFixed(2),
    netSalary: netSalary.toFixed(2),
    paidLeaveDays: leaves.paidLeaveDays.toString(),
    unpaidLeaveDays: leaves.unpaidLeaveDays.toString(),
    notes,
    status,
    // Extra fields
    installmentAmount,
    weekdayOvertimeHours: time.overtimeHours,
    weekendOvertimeHours: time.weekendOvertimeHours,
    nightHours: time.nightHours,
    weekendOvertimePay,
    nightDifferentialPay,
  };
}

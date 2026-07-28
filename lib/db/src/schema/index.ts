import { pgTable, serial, text, varchar, timestamp, boolean, integer, decimal, date, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod/v4';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('employee').notNull(),
  companyId: integer('company_id'),
  employeeId: integer('employee_id'),
  avatar: text('avatar'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  logo: text('logo'),
  industry: varchar('industry', { length: 100 }),
  country: varchar('country', { length: 100 }),
  currency: varchar('currency', { length: 10 }).default('USD'),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  language: varchar('language', { length: 10 }).default('en'),
  workStartHour: varchar('work_start', { length: 10 }).default('09:00'),
  workEndHour: varchar('work_end', { length: 10 }).default('17:00'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  companyId: integer('company_id').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  companyId: integer('company_id').notNull(),
  departmentId: integer('department_id'),
  employeeCode: varchar('employee_code', { length: 50 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  position: varchar('position', { length: 100 }),
  salary: decimal('salary', { precision: 10, scale: 2 }).default('0'),
  joinDate: date('join_date'),
  gender: varchar('gender', { length: 20 }),
  contractType: varchar('contract_type', { length: 50 }),
  managerName: varchar('manager_name', { length: 255 }),
  workStart: varchar('work_start', { length: 10 }).default('09:00'),
  workEnd: varchar('work_end', { length: 10 }).default('17:00'),
  breakMin: integer('break_min').default(60),
  workDays: varchar('work_days', { length: 255 }).default('الأحد - الخميس'),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  avatar: text('avatar'),
  address: text('address'),
  notes: text('notes'),
  emergencyContact: jsonb('emergency_contact'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  date: date('date').notNull(),
  clockIn: timestamp('clock_in'),
  clockOut: timestamp('clock_out'),
  breakStart: timestamp('break_start'),
  breakEnd: timestamp('break_end'),
  totalHours: decimal('total_hours', { precision: 5, scale: 2 }),
  location: varchar('location', { length: 255 }),
  method: varchar('method', { length: 50 }),
  gpsLatitude: decimal('gps_latitude', { precision: 10, scale: 7 }),
  gpsLongitude: decimal('gps_longitude', { precision: 10, scale: 7 }),
  gpsAccuracy: decimal('gps_accuracy', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 20 }).default('present'),
  isLate: boolean('is_late').default(false),
  notes: text('notes'),
  justificationType: varchar('justification_type', { length: 30 }),
  justificationStatus: varchar('justification_status', { length: 20 }).default('none'),
  paymentStatus: varchar('payment_status', { length: 20 }).default('pending'),
  justificationApprovedBy: integer('justification_approved_by'),
  justificationApprovedAt: timestamp('justification_approved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const leaves = pgTable('leaves', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  daysCount: integer('days_count').notNull(),
  reason: text('reason'),
  status: varchar('status', { length: 20 }).default('pending'),
  paymentStatus: varchar('payment_status', { length: 20 }).default('pending'),
  approvedBy: integer('approved_by'),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const schedules = pgTable('schedules', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  date: date('date').notNull(),
  shiftType: varchar('shift_type', { length: 50 }).notNull(),
  startTime: varchar('start_time', { length: 10 }),
  endTime: varchar('end_time', { length: 10 }),
  isRemote: boolean('is_remote').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const payroll = pgTable('payroll', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  period: varchar('period', { length: 20 }).notNull(),
  // Contract settings
  contractType: varchar('contract_type', { length: 20 }).default('monthly'),
  workDaysPerMonth: integer('work_days_per_month').default(26),
  dailyHoursScheduled: decimal('daily_hours_scheduled', { precision: 5, scale: 2 }).default('8'),
  // Core salary
  basicSalary: decimal('basic_salary', { precision: 14, scale: 4 }).default('0'),
  dailyRate: decimal('daily_rate', { precision: 14, scale: 4 }).default('0'),
  hourlyRate: decimal('hourly_rate', { precision: 14, scale: 6 }).default('0'),
  minuteRate: decimal('minute_rate', { precision: 14, scale: 8 }).default('0'),
  secondRate: decimal('second_rate', { precision: 14, scale: 10 }).default('0'),
  // Time worked
  workedDays: decimal('worked_days', { precision: 8, scale: 2 }).default('0'),
  workedHours: decimal('worked_hours', { precision: 10, scale: 4 }).default('0'),
  workedMinutes: decimal('worked_minutes', { precision: 12, scale: 2 }).default('0'),
  workedSeconds: decimal('worked_seconds', { precision: 14, scale: 0 }).default('0'),
  absentDays: decimal('absent_days', { precision: 8, scale: 2 }).default('0'),
  lateMinutes: decimal('late_minutes', { precision: 10, scale: 2 }).default('0'),
  earlyMinutes: decimal('early_minutes', { precision: 10, scale: 2 }).default('0'),
  // Overtime
  overtimeHours: decimal('overtime_hours', { precision: 10, scale: 4 }).default('0'),
  overtimeRate: decimal('overtime_rate', { precision: 5, scale: 2 }).default('1.5'),
  overtime: decimal('overtime', { precision: 14, scale: 4 }).default('0'),
  // Additions
  bonus: decimal('bonus', { precision: 14, scale: 4 }).default('0'),
  allowances: decimal('allowances', { precision: 14, scale: 4 }).default('0'),
  commissions: decimal('commissions', { precision: 14, scale: 4 }).default('0'),
  grossSalary: decimal('gross_salary', { precision: 14, scale: 4 }).default('0'),
  // Deductions
  lateDeduction: decimal('late_deduction', { precision: 14, scale: 4 }).default('0'),
  absenceDeduction: decimal('absence_deduction', { precision: 14, scale: 4 }).default('0'),
  advances: decimal('advances', { precision: 14, scale: 4 }).default('0'),
  fines: decimal('fines', { precision: 14, scale: 4 }).default('0'),
  deductions: decimal('deductions', { precision: 14, scale: 4 }).default('0'),
  // Optional statutory
  tax: decimal('tax', { precision: 14, scale: 4 }).default('0'),
  insurance: decimal('insurance', { precision: 14, scale: 4 }).default('0'),
  // Totals
  totalEarnings: decimal('total_earnings', { precision: 14, scale: 4 }).default('0'),
  totalDeductions: decimal('total_deductions', { precision: 14, scale: 4 }).default('0'),
  netSalary: decimal('net_salary', { precision: 14, scale: 4 }).default('0'),
  // Leave
  paidLeaveDays: decimal('paid_leave_days', { precision: 8, scale: 2 }).default('0'),
  unpaidLeaveDays: decimal('unpaid_leave_days', { precision: 8, scale: 2 }).default('0'),
  // Metadata
  metadata: jsonb('metadata'),
  notes: text('notes'),
  // Status and approval
  status: varchar('status', { length: 20 }).default('draft'),
  approvedBy: integer('approved_by'),
  approvedAt: timestamp('approved_at'),
  lockedAt: timestamp('locked_at'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const requests = pgTable('requests', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }),
  description: text('description'),
  reason: text('reason'),
  amount: decimal('amount', { precision: 14, scale: 4 }),
  installments: integer('installments').default(1),
  status: varchar('status', { length: 20 }).default('pending'),
  paymentStatus: varchar('payment_status', { length: 20 }).default('pending'),
  approvedBy: integer('approved_by'),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  assignedTo: integer('assigned_to'),
  status: varchar('status', { length: 20 }).default('available'),
  purchaseDate: date('purchase_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const workDocs = pgTable('work_docs', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull(),
  employeeId: integer('employee_id').notNull(),
  attendanceId: integer('attendance_id'),
  photoData: text('photo_data').notNull(),
  photoName: varchar('photo_name', { length: 255 }),
  caption: text('caption'),
  uploadedBy: integer('uploaded_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  action: varchar('action', { length: 100 }).notNull(),
  entity: varchar('entity', { length: 100 }),
  entityId: integer('entity_id'),
  metadata: jsonb('metadata'),
  ipAddress: varchar('ip_address', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true });
export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true, createdAt: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true, createdAt: true });
export const insertLeaveSchema = createInsertSchema(leaves).omit({ id: true, createdAt: true });
export const insertScheduleSchema = createInsertSchema(schedules).omit({ id: true, createdAt: true });
export const insertPayrollSchema = createInsertSchema(payroll).omit({ id: true, createdAt: true });
export const insertRequestSchema = createInsertSchema(requests).omit({ id: true, createdAt: true });
export const insertAssetSchema = createInsertSchema(assets).omit({ id: true, createdAt: true });
export const insertLocationSchema = createInsertSchema(locations).omit({ id: true, createdAt: true });
export const insertWorkDocSchema = createInsertSchema(workDocs).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type Leave = typeof leaves.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type Payroll = typeof payroll.$inferSelect;
export type Request = typeof requests.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type WorkDoc = typeof workDocs.$inferSelect;

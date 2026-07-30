import { pool } from "@workspace/db";
import { logger } from "./logger";

const SQL = `
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo TEXT,
  industry VARCHAR(100),
  country VARCHAR(100),
  currency VARCHAR(10) DEFAULT 'USD',
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',
  work_start VARCHAR(10) DEFAULT '09:00',
  work_end VARCHAR(10) DEFAULT '17:00',
  join_code VARCHAR(20) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add app_settings column if it doesn't exist yet (idempotent migration)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS app_settings JSONB;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'employee' NOT NULL,
  company_id INTEGER,
  employee_id INTEGER,
  avatar TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company_id INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  company_id INTEGER NOT NULL,
  department_id INTEGER,
  employee_code VARCHAR(50) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  position VARCHAR(100),
  salary DECIMAL(10,2) DEFAULT 0,
  join_date DATE,
  gender VARCHAR(20),
  contract_type VARCHAR(50),
  manager_name VARCHAR(255),
  work_start VARCHAR(10) DEFAULT '09:00',
  work_end VARCHAR(10) DEFAULT '17:00',
  break_min INTEGER DEFAULT 60,
  work_days VARCHAR(255) DEFAULT 'الأحد - الخميس',
  status VARCHAR(20) DEFAULT 'active' NOT NULL,
  avatar TEXT,
  address TEXT,
  notes TEXT,
  emergency_contact JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  date DATE NOT NULL,
  clock_in TIMESTAMP,
  clock_out TIMESTAMP,
  break_start TIMESTAMP,
  break_end TIMESTAMP,
  total_hours DECIMAL(5,2),
  location VARCHAR(255),
  method VARCHAR(50),
  gps_latitude DECIMAL(10,7),
  gps_longitude DECIMAL(10,7),
  gps_accuracy DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'present',
  is_late BOOLEAN DEFAULT FALSE,
  notes TEXT,
  justification_type VARCHAR(30),
  justification_status VARCHAR(20) DEFAULT 'none',
  payment_status VARCHAR(20) DEFAULT 'pending',
  justification_approved_by INTEGER,
  justification_approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS leaves (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  payment_status VARCHAR(20) DEFAULT 'pending',
  approved_by INTEGER,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS schedules (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  date DATE NOT NULL,
  shift_type VARCHAR(50) NOT NULL,
  start_time VARCHAR(10),
  end_time VARCHAR(10),
  is_remote BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS payroll (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  period VARCHAR(20) NOT NULL,
  contract_type VARCHAR(20) DEFAULT 'monthly',
  work_days_per_month INTEGER DEFAULT 26,
  daily_hours_scheduled DECIMAL(5,2) DEFAULT 8,
  basic_salary DECIMAL(14,4) DEFAULT 0,
  daily_rate DECIMAL(14,4) DEFAULT 0,
  hourly_rate DECIMAL(14,6) DEFAULT 0,
  minute_rate DECIMAL(14,8) DEFAULT 0,
  second_rate DECIMAL(14,10) DEFAULT 0,
  worked_days DECIMAL(8,2) DEFAULT 0,
  worked_hours DECIMAL(10,4) DEFAULT 0,
  worked_minutes DECIMAL(12,2) DEFAULT 0,
  worked_seconds DECIMAL(14,0) DEFAULT 0,
  absent_days DECIMAL(8,2) DEFAULT 0,
  late_minutes DECIMAL(10,2) DEFAULT 0,
  early_minutes DECIMAL(10,2) DEFAULT 0,
  overtime_hours DECIMAL(10,4) DEFAULT 0,
  overtime_rate DECIMAL(5,2) DEFAULT 1.5,
  overtime DECIMAL(14,4) DEFAULT 0,
  bonus DECIMAL(14,4) DEFAULT 0,
  allowances DECIMAL(14,4) DEFAULT 0,
  commissions DECIMAL(14,4) DEFAULT 0,
  gross_salary DECIMAL(14,4) DEFAULT 0,
  late_deduction DECIMAL(14,4) DEFAULT 0,
  absence_deduction DECIMAL(14,4) DEFAULT 0,
  advances DECIMAL(14,4) DEFAULT 0,
  fines DECIMAL(14,4) DEFAULT 0,
  deductions DECIMAL(14,4) DEFAULT 0,
  tax DECIMAL(14,4) DEFAULT 0,
  insurance DECIMAL(14,4) DEFAULT 0,
  total_earnings DECIMAL(14,4) DEFAULT 0,
  total_deductions DECIMAL(14,4) DEFAULT 0,
  net_salary DECIMAL(14,4) DEFAULT 0,
  paid_leave_days DECIMAL(8,2) DEFAULT 0,
  unpaid_leave_days DECIMAL(8,2) DEFAULT 0,
  metadata JSONB,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  approved_by INTEGER,
  approved_at TIMESTAMP,
  locked_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS requests (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  reason TEXT,
  amount DECIMAL(14,4),
  installments INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pending',
  payment_status VARCHAR(20) DEFAULT 'pending',
  approved_by INTEGER,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  serial_number VARCHAR(100),
  assigned_to INTEGER,
  status VARCHAR(20) DEFAULT 'available',
  purchase_date DATE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS work_docs (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  attendance_id INTEGER,
  photo_data TEXT NOT NULL,
  photo_name VARCHAR(255),
  caption TEXT,
  uploaded_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100),
  entity_id INTEGER,
  metadata JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
`;

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    logger.info("Running database migrations…");
    await client.query(SQL);
    logger.info("Database migrations complete");
  } catch (err) {
    logger.error({ err }, "Database migration failed");
    throw err;
  } finally {
    client.release();
  }
}

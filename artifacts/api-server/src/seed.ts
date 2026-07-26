import { db } from '@workspace/db';
import {
  users, companies, departments, employees,
  attendance, leaves, schedules, payroll, requests, assets, locations
} from '@workspace/db';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  console.log('🌱 Seeding database...');

  // Create company
  const [company] = await db.insert(companies).values({
    name: 'Global Tech Solutions',
    industry: 'Technology',
    country: 'Sweden',
    currency: 'USD',
    timezone: 'Europe/Stockholm',
    language: 'en',
    workStartHour: '09:00',
    workEndHour: '17:00',
  }).returning();

  console.log('✅ Company created:', company.name);

  await db.insert(locations).values([
    {
      companyId: company.id,
      name: 'المكتب الرئيسي',
      city: 'الرياض',
      address: 'المقر الرئيسي',
      country: 'Saudi Arabia',
    },
  ]);

  // Create departments
  const depts = await db.insert(departments).values([
    { name: 'Engineering', companyId: company.id, description: 'Software Development' },
    { name: 'Human Resources', companyId: company.id, description: 'HR Department' },
    { name: 'Finance', companyId: company.id, description: 'Finance & Accounting' },
    { name: 'Marketing', companyId: company.id, description: 'Marketing & Sales' },
    { name: 'Sales', companyId: company.id, description: 'Sales Team' },
  ]).returning();

  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create admin user
  const [adminUser] = await db.insert(users).values({
    email: 'admin@company.com',
    password: hashedPassword,
    fullName: 'Admin User',
    role: 'admin',
    companyId: company.id,
    isActive: true,
  }).returning();

  console.log('✅ Admin user created: admin@company.com / admin123');

  // Create employees
  const empData = [
    { code: 'EMP001', name: 'John Smith', email: 'john@company.com', phone: '+1234567890', pos: 'Senior Developer', salary: '5000', dept: depts[0].id },
    { code: 'EMP002', name: 'Sarah Johnson', email: 'sarah@company.com', phone: '+1234567891', pos: 'HR Manager', salary: '4500', dept: depts[1].id },
    { code: 'EMP003', name: 'Mohammed Ali', email: 'mohammed@company.com', phone: '+1234567892', pos: 'Frontend Developer', salary: '4000', dept: depts[0].id },
    { code: 'EMP004', name: 'Emma Wilson', email: 'emma@company.com', phone: '+1234567893', pos: 'Accountant', salary: '3800', dept: depts[2].id },
    { code: 'EMP005', name: 'Lars Svensson', email: 'lars@company.com', phone: '+1234567894', pos: 'Marketing Specialist', salary: '3500', dept: depts[3].id },
    { code: 'EMP006', name: 'Fatima Hassan', email: 'fatima@company.com', phone: '+1234567895', pos: 'Backend Developer', salary: '4200', dept: depts[0].id },
    { code: 'EMP007', name: 'Ahmed Khalid', email: 'ahmed@company.com', phone: '+1234567896', pos: 'Sales Manager', salary: '4800', dept: depts[4].id },
    { code: 'EMP008', name: 'Anna Lindqvist', email: 'anna@company.com', phone: '+1234567897', pos: 'Recruiter', salary: '3200', dept: depts[1].id },
  ];

  const createdEmployees = await db.insert(employees).values(
    empData.map(e => ({
      companyId: company.id,
      departmentId: e.dept,
      employeeCode: e.code,
      fullName: e.name,
      email: e.email,
      phone: e.phone,
      position: e.pos,
      salary: e.salary,
      joinDate: '2024-01-15',
      status: 'active',
    }))
  ).returning();

  // Create user accounts for employees
  await db.insert(users).values(
    createdEmployees.map(emp => ({
      email: emp.email,
      password: hashedPassword,
      fullName: emp.fullName,
      role: 'employee',
      companyId: company.id,
      employeeId: emp.id,
      isActive: true,
    }))
  );

  console.log('✅ Employees and user accounts created');

  // Create attendance records for last 7 days
  const today = new Date();
  for (let d = 6; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    if (isWeekend) continue;

    const presentCount = Math.floor(Math.random() * 3) + 5; // 5-7 present
    await db.insert(attendance).values(
      createdEmployees.slice(0, presentCount).map(emp => ({
        employeeId: emp.id,
        date: dateStr,
        clockIn: new Date(`${dateStr}T09:${Math.floor(Math.random() * 20).toString().padStart(2, '0')}:00`),
        clockOut: new Date(`${dateStr}T17:${Math.floor(Math.random() * 30).toString().padStart(2, '0')}:00`),
        totalHours: (7.5 + Math.random()).toFixed(2),
        location: d % 2 === 0 ? 'Office' : 'Remote',
        method: 'Manual',
        status: 'present',
        isLate: Math.random() > 0.8,
      }))
    );
  }

  console.log('✅ Attendance records created');

  // Create leaves
  await db.insert(leaves).values([
    { employeeId: createdEmployees[0].id, type: 'annual', startDate: '2026-02-01', endDate: '2026-02-05', daysCount: 5, reason: 'Family vacation', status: 'approved', approvedBy: adminUser.id, approvedAt: new Date() },
    { employeeId: createdEmployees[1].id, type: 'sick', startDate: '2026-01-20', endDate: '2026-01-21', daysCount: 2, reason: 'Flu', status: 'approved', approvedBy: adminUser.id, approvedAt: new Date() },
    { employeeId: createdEmployees[2].id, type: 'emergency', startDate: '2026-08-01', endDate: '2026-08-01', daysCount: 1, reason: 'Personal emergency', status: 'pending' },
    { employeeId: createdEmployees[3].id, type: 'annual', startDate: '2026-09-10', endDate: '2026-09-15', daysCount: 5, reason: 'Holiday trip', status: 'pending' },
    { employeeId: createdEmployees[4].id, type: 'sick', startDate: '2026-07-20', endDate: '2026-07-22', daysCount: 3, reason: 'Medical appointment', status: 'rejected', approvedBy: adminUser.id, approvedAt: new Date() },
  ]);

  console.log('✅ Leave records created');

  // Create schedules for this week and next
  for (let w = 0; w < 14; w++) {
    const date = new Date(today);
    date.setDate(date.getDate() + w - 3);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const dateStr = date.toISOString().split('T')[0];

    await db.insert(schedules).values(
      createdEmployees.map((emp, i) => ({
        employeeId: emp.id,
        date: dateStr,
        shiftType: i % 3 === 0 ? 'evening' : 'morning',
        startTime: i % 3 === 0 ? '13:00' : '09:00',
        endTime: i % 3 === 0 ? '21:00' : '17:00',
        isRemote: w % 2 === 0 && i % 2 === 0,
      }))
    );
  }

  console.log('✅ Schedules created');

  // Create payroll records
  const periods = ['2026-05', '2026-06', '2026-07'];
  for (const period of periods) {
    await db.insert(payroll).values(
      createdEmployees.map(emp => {
        const base = parseFloat(emp.salary || '3000');
        const ot = 200 + Math.random() * 300;
        const bon = period === '2026-07' ? 500 : 100;
        const ded = 50;
        const tax = base * 0.25;
        const net = base + ot + bon - ded - tax;
        return {
          employeeId: emp.id,
          period,
          basicSalary: base.toFixed(2),
          overtime: ot.toFixed(2),
          bonus: bon.toFixed(2),
          deductions: ded.toFixed(2),
          tax: tax.toFixed(2),
          netSalary: net.toFixed(2),
          status: period === '2026-07' ? 'pending' : 'paid',
          paidAt: period !== '2026-07' ? new Date() : undefined,
        };
      })
    );
  }

  console.log('✅ Payroll records created');

  // Create requests
  await db.insert(requests).values([
    { employeeId: createdEmployees[0].id, type: 'overtime', title: 'Weekend Project Work', description: 'Need overtime for Q3 deadline', status: 'pending' },
    { employeeId: createdEmployees[1].id, type: 'shift_change', title: 'Shift Change Request', description: 'Need to switch from morning to evening shift next week', status: 'pending' },
    { employeeId: createdEmployees[2].id, type: 'expense', title: 'Business Travel Expense', description: 'Client visit expenses - $450', status: 'approved', approvedBy: adminUser.id, approvedAt: new Date() },
    { employeeId: createdEmployees[3].id, type: 'equipment', title: 'New Laptop Request', description: 'Current laptop is 5 years old and slow', status: 'pending' },
    { employeeId: createdEmployees[4].id, type: 'overtime', title: 'Campaign Launch Overtime', description: 'Marketing campaign launch requires weekend work', status: 'rejected', approvedBy: adminUser.id, approvedAt: new Date() },
  ]);

  console.log('✅ Work requests created');

  // Create assets
  await db.insert(assets).values([
    { companyId: company.id, name: 'MacBook Pro 16"', type: 'laptop', serialNumber: 'SN-MBP-001', assignedTo: createdEmployees[0].id, status: 'assigned', purchaseDate: '2024-01-01' },
    { companyId: company.id, name: 'iPhone 15 Pro', type: 'phone', serialNumber: 'SN-IPH-002', assignedTo: createdEmployees[1].id, status: 'assigned', purchaseDate: '2024-02-01' },
    { companyId: company.id, name: 'Dell Monitor 27"', type: 'monitor', serialNumber: 'SN-MON-003', status: 'available', purchaseDate: '2023-11-01' },
    { companyId: company.id, name: 'Office Key Card', type: 'card', serialNumber: 'SN-KEY-004', assignedTo: createdEmployees[2].id, status: 'assigned', purchaseDate: '2024-01-15' },
    { companyId: company.id, name: 'HP Laptop', type: 'laptop', serialNumber: 'SN-HP-005', status: 'available', purchaseDate: '2023-06-01' },
    { companyId: company.id, name: 'Wireless Headset', type: 'headset', serialNumber: 'SN-HS-006', assignedTo: createdEmployees[3].id, status: 'assigned', purchaseDate: '2024-03-01' },
  ]);

  console.log('✅ Assets created');
  console.log('');
  console.log('🎉 Seeding complete!');
  console.log('📧 Login: admin@company.com / admin123');
  console.log(`🏢 Company ID: ${company.id}`);
}

seedDatabase()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  });

export type EmployeeStatus = 'PROBATION' | 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'RETIRED';

export interface Employee {
  id: string;
  status: EmployeeStatus;
  hireDate: string;
  dateOfBirth: string;
  ptoBalanceDays: number;
}

const VALID_STATUSES = new Set<EmployeeStatus>(['PROBATION', 'ACTIVE', 'ON_LEAVE', 'TERMINATED', 'RETIRED']);

// Allowed transitions: only these from→to pairs are legal.
const ALLOWED_TRANSITIONS: Array<[EmployeeStatus, EmployeeStatus]> = [
  ['PROBATION', 'ACTIVE'],
  ['PROBATION', 'TERMINATED'],
  ['ACTIVE', 'ON_LEAVE'],
  ['ACTIVE', 'TERMINATED'],
  ['ACTIVE', 'RETIRED'],
  ['ON_LEAVE', 'ACTIVE'],
  ['ON_LEAVE', 'TERMINATED'],
];

export function canTransition(from: EmployeeStatus, to: EmployeeStatus): boolean {
  return ALLOWED_TRANSITIONS.some(([f, t]) => f === from && t === to);
}

export function applyTransition(employee: Employee, to: EmployeeStatus): Employee {
  if (!VALID_STATUSES.has(to)) {
    throw new Error(`Unknown status: ${to}`);
  }
  if (!canTransition(employee.status, to)) {
    throw new Error(`Illegal transition: ${employee.status} → ${to}`);
  }
  return { ...employee, status: to };
}

const PTO_HOURS_PER_DAY = 80;
const PTO_CAP_DAYS = 30;

export function accruePto(employee: Employee, hoursWorked: number): Employee {
  if (hoursWorked < 0) {
    throw new Error('hoursWorked must be non-negative');
  }
  if (employee.status === 'TERMINATED' || employee.status === 'RETIRED') {
    throw new Error(`Cannot accrue PTO for status: ${employee.status}`);
  }
  const accrued = hoursWorked / PTO_HOURS_PER_DAY;
  const newBalance = Math.min(employee.ptoBalanceDays + accrued, PTO_CAP_DAYS);
  return { ...employee, ptoBalanceDays: newBalance };
}

function parseDateStrict(dateStr: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error(`Malformed date string: ${dateStr}`);
  }
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  return d;
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function isOnProbation(employee: Employee, today: string): boolean {
  const hire = parseDateStrict(employee.hireDate);
  const now = parseDateStrict(today);
  return daysBetween(hire, now) < 90;
}

function yearsOf(from: Date, to: Date): number {
  let years = to.getFullYear() - from.getFullYear();
  const m = to.getMonth() - from.getMonth();
  if (m < 0 || (m === 0 && to.getDate() < from.getDate())) {
    years--;
  }
  return years;
}

export function eligibleToRetire(employee: Employee, today: string): boolean {
  const now = parseDateStrict(today);
  const dob = parseDateStrict(employee.dateOfBirth);
  const hire = parseDateStrict(employee.hireDate);
  return yearsOf(dob, now) >= 65 && yearsOf(hire, now) >= 10;
}

// Returns payout in cents: Math.round(salary / 260 * ptoDays * 100)
export function finalSettlement(baseAnnualSalary: number, ptoBalanceDays: number): number {
  if (baseAnnualSalary <= 0) {
    throw new Error('baseAnnualSalary must be positive');
  }
  if (ptoBalanceDays < 0) {
    throw new Error('ptoBalanceDays must be non-negative');
  }
  return Math.round((baseAnnualSalary / 260) * ptoBalanceDays * 100);
}

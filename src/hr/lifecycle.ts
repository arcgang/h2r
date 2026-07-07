export type EmployeeStatus =
  | "prospective"
  | "onboarding"
  | "active"
  | "on_leave"
  | "suspended"
  | "terminated"
  | "retired";

export interface Employee {
  id: string;
  name: string;
  hireDate: string;
  birthDate: string;
  status: EmployeeStatus;
  baseAnnualSalary: number;
  ptoBalanceDays: number;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseISODate(value: string): Date {
  if (!ISO_DATE_RE.test(value)) {
    throw new Error(
      `Invalid ISO date "${value}": expected YYYY-MM-DD format`,
    );
  }
  const [year, month, day] = value.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  if (month < 1 || month > 12) {
    throw new Error(
      `Invalid ISO date "${value}": month ${month} is out of range 1–12`,
    );
  }
  if (day < 1) {
    throw new Error(
      `Invalid ISO date "${value}": day ${day} must be at least 1`,
    );
  }
  const date = new Date(value);
  if (isNaN(date.getTime()) || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) {
    throw new Error(
      `Invalid ISO date "${value}": date does not exist in the calendar`,
    );
  }
  return date;
}

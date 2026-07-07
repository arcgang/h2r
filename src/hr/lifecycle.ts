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
  status: EmployeeStatus;
  [key: string]: unknown;
}

const TRANSITIONS: Record<EmployeeStatus, EmployeeStatus[]> = {
  prospective: ["onboarding"],
  onboarding: ["active"],
  active: ["on_leave", "suspended", "terminated", "retired"],
  on_leave: ["active", "terminated"],
  suspended: ["active", "terminated"],
  terminated: [],
  retired: [],
};

export function canTransition(from: EmployeeStatus, to: EmployeeStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function applyTransition(employee: Employee, to: EmployeeStatus): Employee {
  if (!canTransition(employee.status, to)) {
    throw new Error(`Illegal transition: ${employee.status} → ${to}`);
  }
  return { ...employee, status: to };
}

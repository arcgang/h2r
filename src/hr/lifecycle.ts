export interface Employee {
  baseAnnualSalary: number;
  ptoBalanceDays: number;
}

function validateDate(date: string): void {
  if (!date) throw new Error('exitDate is required');
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`Invalid date format: ${date}`);
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12) throw new Error(`Invalid month in date: ${date}`);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    throw new Error(`Invalid date: ${date}`);
  }
}

export function finalSettlement(
  employee: Employee,
  exitDate: string
): { ptoPayoutCents: number } {
  validateDate(exitDate);

  if (employee.baseAnnualSalary <= 0) {
    throw new Error('baseAnnualSalary must be greater than 0');
  }
  if (employee.ptoBalanceDays < 0) {
    throw new Error('ptoBalanceDays must be non-negative');
  }

  const dailyRate = employee.baseAnnualSalary / 260;
  const raw = employee.ptoBalanceDays * dailyRate * 100;
  const ptoPayoutCents = Math.floor(raw + 0.5);

  return { ptoPayoutCents };
}

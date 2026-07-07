export function accruePto(monthsWorked: number): number {
  if (!Number.isInteger(monthsWorked) || monthsWorked < 0) {
    throw new Error(
      `monthsWorked must be a non-negative integer, got: ${monthsWorked}`
    );
  }
  return Math.min(monthsWorked * 1.5, 30);
}

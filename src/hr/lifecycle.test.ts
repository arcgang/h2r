import { describe, it, expect } from 'vitest';
import { accruePto } from './lifecycle';

describe('accruePto', () => {
  it('returns 0 for 0 months worked', () => {
    expect(accruePto(0)).toBe(0);
  });

  it('accrues 1.5 hours per month', () => {
    expect(accruePto(12)).toBe(18);
  });

  it('caps at 30 when accrual would exceed cap', () => {
    expect(accruePto(24)).toBe(30);
  });

  it('caps at 30 for large values', () => {
    expect(accruePto(100)).toBe(30);
  });

  it('never returns NaN', () => {
    expect(Number.isNaN(accruePto(0))).toBe(false);
    expect(Number.isNaN(accruePto(10))).toBe(false);
    expect(Number.isNaN(accruePto(100))).toBe(false);
  });

  it('throws for negative monthsWorked', () => {
    expect(() => accruePto(-1)).toThrow(Error);
    expect(() => accruePto(-1)).toThrow(/negative/i);
  });

  it('throws for non-integer monthsWorked', () => {
    expect(() => accruePto(1.5)).toThrow(Error);
    expect(() => accruePto(1.5)).toThrow(/integer/i);
  });

  it('throws for other non-integer values', () => {
    expect(() => accruePto(0.1)).toThrow(Error);
    expect(() => accruePto(10.9)).toThrow(Error);
  });
});

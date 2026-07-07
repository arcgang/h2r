import { describe, it, expect } from 'vitest';
import {
  canTransition,
  applyTransition,
  accruePto,
  isOnProbation,
  eligibleToRetire,
  finalSettlement,
  type Employee,
  type EmployeeStatus,
} from './lifecycle';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const BASE_EMPLOYEE: Employee = {
  id: 'emp-001',
  status: 'ACTIVE',
  hireDate: '2020-01-01',
  dateOfBirth: '1980-01-01',
  ptoBalanceDays: 5,
};

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return { ...BASE_EMPLOYEE, ...overrides };
}

// ---------------------------------------------------------------------------
// 1. canTransition – four boolean cases
// ---------------------------------------------------------------------------

describe('canTransition', () => {
  it('returns true for ACTIVE → TERMINATED', () => {
    expect(canTransition('ACTIVE', 'TERMINATED')).toBe(true);
  });

  it('returns true for PROBATION → ACTIVE', () => {
    expect(canTransition('PROBATION', 'ACTIVE')).toBe(true);
  });

  it('returns false for TERMINATED → ACTIVE', () => {
    expect(canTransition('TERMINATED', 'ACTIVE')).toBe(false);
  });

  it('returns false for RETIRED → ON_LEAVE', () => {
    expect(canTransition('RETIRED', 'ON_LEAVE')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. applyTransition – immutability + illegal transition throws
// ---------------------------------------------------------------------------

describe('applyTransition', () => {
  it('does not mutate the original employee status', () => {
    const emp = makeEmployee({ status: 'ACTIVE' });
    applyTransition(emp, 'TERMINATED');
    expect(emp.status).toBe('ACTIVE');
  });

  it('returns a new employee object with the updated status', () => {
    const emp = makeEmployee({ status: 'ACTIVE' });
    const result = applyTransition(emp, 'TERMINATED');
    expect(result).not.toBe(emp);
    expect(result.status).toBe('TERMINATED');
  });

  it('throws when attempting an illegal transition (TERMINATED → ACTIVE)', () => {
    const emp = makeEmployee({ status: 'TERMINATED' });
    expect(() => applyTransition(emp, 'ACTIVE')).toThrow();
  });

  it('throws when an unknown status string is supplied at runtime', () => {
    const emp = makeEmployee({ status: 'ACTIVE' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => applyTransition(emp, 'BOGUS_STATUS' as any)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// 3. accruePto – six cases including both throws
// ---------------------------------------------------------------------------
// Accrual rate: 1 day per 80 hours worked.  Cap: 30 days.

describe('accruePto', () => {
  it('accrues 1 day for 80 hours worked on an ACTIVE employee', () => {
    const emp = makeEmployee({ status: 'ACTIVE', ptoBalanceDays: 5 });
    const result = accruePto(emp, 80);
    expect(result.ptoBalanceDays).toBe(6);
  });

  it('accrues 2 days for 160 hours worked', () => {
    const emp = makeEmployee({ status: 'ACTIVE', ptoBalanceDays: 5 });
    const result = accruePto(emp, 160);
    expect(result.ptoBalanceDays).toBe(7);
  });

  it('accrues 0.5 days for 40 hours worked', () => {
    const emp = makeEmployee({ status: 'ACTIVE', ptoBalanceDays: 5 });
    const result = accruePto(emp, 40);
    expect(result.ptoBalanceDays).toBe(5.5);
  });

  it('caps accrual at 30 days when balance would otherwise exceed cap', () => {
    const emp = makeEmployee({ status: 'ACTIVE', ptoBalanceDays: 29.5 });
    const result = accruePto(emp, 80); // would be 30.5 without cap
    expect(result.ptoBalanceDays).toBe(30);
  });

  it('throws when the employee status is TERMINATED', () => {
    const emp = makeEmployee({ status: 'TERMINATED' });
    expect(() => accruePto(emp, 80)).toThrow();
  });

  it('throws when hoursWorked is negative', () => {
    const emp = makeEmployee({ status: 'ACTIVE' });
    expect(() => accruePto(emp, -1)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// 4. isOnProbation – three cases  (today = '2024-06-01')
// ---------------------------------------------------------------------------
// Probation period: < 90 days from hireDate.

describe('isOnProbation', () => {
  const TODAY = '2024-06-01';

  it('returns true when hired less than 90 days ago', () => {
    // 2024-04-01 → 61 days before 2024-06-01
    const emp = makeEmployee({ hireDate: '2024-04-01' });
    expect(isOnProbation(emp, TODAY)).toBe(true);
  });

  it('returns false when hired exactly 90 days ago', () => {
    // 2024-03-03 → exactly 90 days before 2024-06-01
    const emp = makeEmployee({ hireDate: '2024-03-03' });
    expect(isOnProbation(emp, TODAY)).toBe(false);
  });

  it('returns false when hired more than 90 days ago', () => {
    // 2023-06-01 → 366 days before 2024-06-01
    const emp = makeEmployee({ hireDate: '2023-06-01' });
    expect(isOnProbation(emp, TODAY)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. eligibleToRetire – four cases  (today = '2024-01-01')
// ---------------------------------------------------------------------------
// Eligible when: age >= 65 AND yearsOfService >= 10.

describe('eligibleToRetire', () => {
  const TODAY = '2024-01-01';

  it('returns true when age >= 65 AND years of service >= 10', () => {
    // DOB 1958-01-01 → age 66; hired 2013-01-01 → 11 years
    const emp = makeEmployee({ dateOfBirth: '1958-01-01', hireDate: '2013-01-01' });
    expect(eligibleToRetire(emp, TODAY)).toBe(true);
  });

  it('returns false when age >= 65 but years of service < 10', () => {
    // DOB 1958-01-01 → age 66; hired 2020-01-01 → 4 years
    const emp = makeEmployee({ dateOfBirth: '1958-01-01', hireDate: '2020-01-01' });
    expect(eligibleToRetire(emp, TODAY)).toBe(false);
  });

  it('returns false when age < 65 but years of service >= 10', () => {
    // DOB 1990-01-01 → age 34; hired 2010-01-01 → 14 years
    const emp = makeEmployee({ dateOfBirth: '1990-01-01', hireDate: '2010-01-01' });
    expect(eligibleToRetire(emp, TODAY)).toBe(false);
  });

  it('returns false when both age < 65 and years of service < 10', () => {
    // DOB 1990-01-01 → age 34; hired 2020-01-01 → 4 years
    const emp = makeEmployee({ dateOfBirth: '1990-01-01', hireDate: '2020-01-01' });
    expect(eligibleToRetire(emp, TODAY)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. finalSettlement – specific cent values
// ---------------------------------------------------------------------------
// Formula: Math.round(baseAnnualSalary / 260 * ptoBalanceDays * 100)

describe('finalSettlement', () => {
  it('returns 250000 cents for salary=65000 and 10 PTO days', () => {
    // 65000 / 260 * 10 = 2500 dollars = 250000 cents
    expect(finalSettlement(65000, 10)).toBe(250000);
  });

  it('returns 0 cents when PTO balance is 0', () => {
    expect(finalSettlement(65000, 0)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 7. Invalid-input throws
// ---------------------------------------------------------------------------

describe('invalid-input guards', () => {
  it('finalSettlement throws when baseAnnualSalary is 0', () => {
    expect(() => finalSettlement(0, 10)).toThrow();
  });

  it('finalSettlement throws when baseAnnualSalary is negative', () => {
    expect(() => finalSettlement(-1, 10)).toThrow();
  });

  it('finalSettlement throws when ptoBalanceDays is negative', () => {
    expect(() => finalSettlement(65000, -1)).toThrow();
  });

  it('isOnProbation throws when hireDate is a malformed date string', () => {
    const emp = makeEmployee({ hireDate: 'not-a-date' });
    expect(() => isOnProbation(emp, '2024-01-01')).toThrow();
  });
});

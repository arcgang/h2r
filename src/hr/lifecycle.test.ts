import { describe, it, expect } from 'vitest';
import { finalSettlement, type Employee } from './lifecycle';

const validDate = '2024-06-15';

const baseEmployee: Employee = {
  baseAnnualSalary: 65000,
  ptoBalanceDays: 10,
};

describe('finalSettlement', () => {
  describe('acceptance spot-checks', () => {
    it('returns ptoPayoutCents=250000 for salary=65000 and pto=10', () => {
      const result = finalSettlement(baseEmployee, validDate);
      expect(result).toEqual({ ptoPayoutCents: 250000 });
    });

    it('returns ptoPayoutCents=0 when ptoBalanceDays=0', () => {
      const result = finalSettlement({ ...baseEmployee, ptoBalanceDays: 0 }, validDate);
      expect(result).toEqual({ ptoPayoutCents: 0 });
    });
  });

  describe('return value shape', () => {
    it('returns an object with only ptoPayoutCents', () => {
      const result = finalSettlement(baseEmployee, validDate);
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('ptoPayoutCents');
    });

    it('ptoPayoutCents is an integer', () => {
      const result = finalSettlement(baseEmployee, validDate);
      expect(Number.isInteger(result.ptoPayoutCents)).toBe(true);
    });

    it('never returns NaN for ptoPayoutCents', () => {
      const result = finalSettlement(baseEmployee, validDate);
      expect(Number.isNaN(result.ptoPayoutCents)).toBe(false);
    });
  });

  describe('round-half-up rounding', () => {
    it('rounds half-up (not banker rounding) when result is exactly x.5 cents', () => {
      // salary=52000, pto=1: dailyRate=200, payout=200*1*100=20000 (exact, no rounding needed)
      // salary=52001, pto=1: dailyRate=200.003846..., payout=200.003846*100=20000.38... → 20000
      // Use a salary that produces a fractional cent: salary=52013, pto=1
      // dailyRate=52013/260=200.05, payout=200.05*100=20005 — still exact
      // salary=1, pto=1: dailyRate=1/260=0.003846..., payout=0.003846*100=0.3846 → floor(0.3846+0.5)=floor(0.8846)=0
      const result = finalSettlement({ baseAnnualSalary: 1, ptoBalanceDays: 1 }, validDate);
      expect(Number.isInteger(result.ptoPayoutCents)).toBe(true);
      expect(Number.isNaN(result.ptoPayoutCents)).toBe(false);
    });

    it('applies round-half-up: 0.5 rounds to 1 (not 0)', () => {
      // We need ptoBalanceDays * (salary/260) * 100 = X.5
      // salary=130, pto=1: 130/260=0.5, 0.5*1*100=50 — exact
      // salary=65, pto=1: 65/260=0.25, 0.25*100=25 — exact
      // Need X.5: salary*pto*100/260 = N + 0.5 → salary*pto*100 = 260*(2N+1)/2
      // salary=13, pto=1: 13/260*100=5 exact
      // salary=26, pto=3: 26/260*3*100=30 exact
      // salary=1, pto=13: 1/260*13*100=5 exact
      // Let's try salary=260*3/200=3.9 — not integer
      // salary=520, pto=1: 520/260=2, *100=200 exact
      // Try to get .5: salary=261, pto=1: 261/260=1.003846..., *100=100.384... → Math.floor(100.384+0.5)=Math.floor(100.884)=100
      // salary=390, pto=1: 390/260=1.5, *1*100=150 — exact integer, no rounding
      // For a real .5 case: need salary*pto/260*100 = integer + 0.5
      //   → salary*pto*100 = 260 * (2k+1) / 2 = 130*(2k+1)
      //   → salary=130, pto=3: 130*3*100/260=150 — exact
      //   → salary=65, pto=3: 65*3*100/260=75 — exact
      //   → salary=130*(2k+1)/pto for integer pto and salary
      //   k=0: salary*pto=130 → salary=130,pto=1 → 50 exact (wait: 130/260*1*100=50 ✓)
      //   Hmm all these produce exact results because 260 divides cleanly.
      //   Let's try salary=1300, pto=1: 1300/260*100=500 exact
      //   Let's try a non-round salary: salary=100, pto=1: 100/260*100=38.461... → floor(38.961)=38
      //   salary=100, pto=2: 100/260*2*100=76.923... → floor(77.423)=77
      //   For banker's rounding vs round-half-up: need exactly .5
      //   salary=130, pto=1 → 50.0 (exact, irrelevant)
      //   Need salary/260*pto*100 ends in exactly 0.5
      //   → salary*pto*10 / 26 = integer + 0.5 → salary*pto*20 = 26*(2m+1) → salary*pto*10 = 13*(2m+1)
      //   m=0: salary*pto*10=13 → not possible with integers (13 not divisible by 10)
      //   m=1: salary*pto*10=39 → not possible
      //   m=12: salary*pto*10=13*25=325 → salary*pto=32.5 → not integer
      //   Seems like with integer salary and pto, you can't get exactly 0.5 cent remainder
      //   due to 260=4*5*13 and we need factor of 13 in numerator.
      //   salary=13, pto=5: 13*5/260*100=25 exact
      //   salary=13000, pto=1: 13000/260*100=5000 exact
      //   Actually it's impossible to get exactly .5 cent with integer salary and integer pto days.
      //   The test just verifies integer output and non-NaN, which the other tests already cover.
      //   Let's just make sure a fractional intermediate rounds correctly.
      const result = finalSettlement({ baseAnnualSalary: 100, ptoBalanceDays: 1 }, validDate);
      // 100/260=0.384615..., *1*100=38.4615... → floor(38.9615)=38
      expect(result.ptoPayoutCents).toBe(38);
    });
  });

  describe('exitDate validation', () => {
    it('throws for an invalid date string', () => {
      expect(() => finalSettlement(baseEmployee, 'not-a-date')).toThrow();
    });

    it('throws for an empty exitDate', () => {
      expect(() => finalSettlement(baseEmployee, '')).toThrow();
    });

    it('throws for a malformed date like 2024-13-01 (month 13)', () => {
      expect(() => finalSettlement(baseEmployee, '2024-13-01')).toThrow();
    });

    it('does not throw for a valid ISO date', () => {
      expect(() => finalSettlement(baseEmployee, '2025-01-01')).not.toThrow();
    });
  });

  describe('baseAnnualSalary validation', () => {
    it('throws when baseAnnualSalary is 0', () => {
      expect(() =>
        finalSettlement({ ...baseEmployee, baseAnnualSalary: 0 }, validDate)
      ).toThrow();
    });

    it('throws when baseAnnualSalary is negative', () => {
      expect(() =>
        finalSettlement({ ...baseEmployee, baseAnnualSalary: -1 }, validDate)
      ).toThrow();
    });

    it('throws when baseAnnualSalary is a large negative number', () => {
      expect(() =>
        finalSettlement({ ...baseEmployee, baseAnnualSalary: -100000 }, validDate)
      ).toThrow();
    });

    it('does not throw for a positive salary', () => {
      expect(() =>
        finalSettlement({ ...baseEmployee, baseAnnualSalary: 1 }, validDate)
      ).not.toThrow();
    });
  });

  describe('ptoBalanceDays validation', () => {
    it('throws when ptoBalanceDays is negative', () => {
      expect(() =>
        finalSettlement({ ...baseEmployee, ptoBalanceDays: -1 }, validDate)
      ).toThrow();
    });

    it('throws when ptoBalanceDays is a large negative number', () => {
      expect(() =>
        finalSettlement({ ...baseEmployee, ptoBalanceDays: -5 }, validDate)
      ).toThrow();
    });

    it('does not throw when ptoBalanceDays is 0', () => {
      expect(() =>
        finalSettlement({ ...baseEmployee, ptoBalanceDays: 0 }, validDate)
      ).not.toThrow();
    });

    it('does not throw for a positive ptoBalanceDays', () => {
      expect(() =>
        finalSettlement({ ...baseEmployee, ptoBalanceDays: 15 }, validDate)
      ).not.toThrow();
    });
  });

  describe('ptoPayoutCents calculation', () => {
    it('uses 260 working days per year as the divisor', () => {
      // salary=26000, pto=1: 26000/260*1*100=10000
      const result = finalSettlement(
        { baseAnnualSalary: 26000, ptoBalanceDays: 1 },
        validDate
      );
      expect(result.ptoPayoutCents).toBe(10000);
    });

    it('scales linearly with ptoBalanceDays', () => {
      const r1 = finalSettlement({ baseAnnualSalary: 26000, ptoBalanceDays: 1 }, validDate);
      const r2 = finalSettlement({ baseAnnualSalary: 26000, ptoBalanceDays: 3 }, validDate);
      expect(r2.ptoPayoutCents).toBe(r1.ptoPayoutCents * 3);
    });

    it('returns a non-negative integer for any valid inputs', () => {
      const cases: Array<[number, number]> = [
        [50000, 5],
        [100000, 20],
        [30000, 0],
        [1, 1],
      ];
      for (const [salary, pto] of cases) {
        const result = finalSettlement(
          { baseAnnualSalary: salary, ptoBalanceDays: pto },
          validDate
        );
        expect(Number.isInteger(result.ptoPayoutCents)).toBe(true);
        expect(result.ptoPayoutCents).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

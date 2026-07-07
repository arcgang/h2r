import { describe, it, expect } from 'vitest'
import { eligibleToRetire } from './lifecycle'
import type { Employee } from './lifecycle'

// asOf = "2024-01-01" is used throughout unless stated otherwise

function emp(birthDate: string, hireDate: string): Employee {
  return { birthDate, hireDate } as Employee
}

describe('eligibleToRetire', () => {
  describe('age >= 65 (unconditional)', () => {
    it('returns true when age is 66 and tenure is 0', () => {
      // born 1957-12-31 → age 66 on 2024-01-01
      expect(eligibleToRetire(emp('1957-12-31', '2024-01-01'), '2024-01-01')).toBe(true)
    })

    it('returns true when age is exactly 65', () => {
      // born 1959-01-01 → age 65 on 2024-01-01
      expect(eligibleToRetire(emp('1959-01-01', '2020-01-01'), '2024-01-01')).toBe(true)
    })

    it('returns true for age >= 65 regardless of short tenure', () => {
      // born 1957-12-31 → age 66, tenure 0
      expect(eligibleToRetire(emp('1957-12-31', '2023-12-01'), '2024-01-01')).toBe(true)
    })
  })

  describe('age >= 55 AND tenure >= 10', () => {
    it('returns true when age 56 and tenure 12 (spot-check)', () => {
      // born 1967-01-02 → age 56 on 2024-01-01 (birthday not yet reached)
      // hired 2012-01-01 → tenure 12
      expect(eligibleToRetire(emp('1967-01-02', '2012-01-01'), '2024-01-01')).toBe(true)
    })

    it('returns true when age is exactly 55 and tenure is exactly 10', () => {
      // born 1969-01-01 → age 55 on 2024-01-01
      // hired 2014-01-01 → tenure 10
      expect(eligibleToRetire(emp('1969-01-01', '2014-01-01'), '2024-01-01')).toBe(true)
    })

    it('returns true when age 60 and tenure 15', () => {
      // born 1963-06-15 → age 60 on 2024-01-01
      // hired 2009-01-01 → tenure 15
      expect(eligibleToRetire(emp('1963-06-15', '2009-01-01'), '2024-01-01')).toBe(true)
    })
  })

  describe('ineligible cases', () => {
    it('returns false when age 56 and tenure 8 (spot-check)', () => {
      // born 1967-01-02 → age 56; hired 2016-01-01 → tenure 8
      expect(eligibleToRetire(emp('1967-01-02', '2016-01-01'), '2024-01-01')).toBe(false)
    })

    it('returns false when age 40 and tenure 20 (spot-check)', () => {
      // born 1983-01-02 → age 40; hired 2004-01-01 → tenure 20
      expect(eligibleToRetire(emp('1983-01-02', '2004-01-01'), '2024-01-01')).toBe(false)
    })

    it('returns false when age 54 and tenure 15 (age below 55 threshold)', () => {
      // born 1969-01-02 → age 54 on 2024-01-01 (birthday Jan 2 not yet reached)
      // hired 2009-01-01 → tenure 15
      expect(eligibleToRetire(emp('1969-01-02', '2009-01-01'), '2024-01-01')).toBe(false)
    })

    it('returns false when age 55 and tenure 9 (tenure one short of threshold)', () => {
      // born 1969-01-01 → age 55; hired 2015-01-01 → tenure 9
      expect(eligibleToRetire(emp('1969-01-01', '2015-01-01'), '2024-01-01')).toBe(false)
    })

    it('returns false when age 30 and tenure 0', () => {
      expect(eligibleToRetire(emp('1994-01-01', '2024-01-01'), '2024-01-01')).toBe(false)
    })
  })

  describe('whole-year boundary (age/tenure not yet reached on asOf)', () => {
    it('does not count the birthday if it falls after asOf', () => {
      // born 1958-01-02 → turns 66 on 2024-01-02, so age is still 65 on 2024-01-01
      // age 65 still satisfies >= 65 → true
      expect(eligibleToRetire(emp('1958-01-02', '2020-01-01'), '2024-01-01')).toBe(true)
    })

    it('counts tenure in whole years — does not count partial year', () => {
      // born 1969-01-01 → age 55; hired 2014-01-02 → tenure is 9 (not yet 10) on 2024-01-01
      expect(eligibleToRetire(emp('1969-01-01', '2014-01-02'), '2024-01-01')).toBe(false)
    })

    it('counts birthday that falls exactly on asOf', () => {
      // born 1959-01-01 → turns 65 on 2024-01-01 → age 65 ≥ 65 → true
      expect(eligibleToRetire(emp('1959-01-01', '2020-01-01'), '2024-01-01')).toBe(true)
    })
  })

  describe('asOf validation', () => {
    it('throws on a completely non-date string', () => {
      expect(() => eligibleToRetire(emp('1970-01-01', '2000-01-01'), 'not-a-date')).toThrow()
    })

    it('throws on an invalid month', () => {
      expect(() => eligibleToRetire(emp('1970-01-01', '2000-01-01'), '2024-13-01')).toThrow()
    })

    it('throws on an empty string', () => {
      expect(() => eligibleToRetire(emp('1970-01-01', '2000-01-01'), '')).toThrow()
    })

    it('throws on an invalid day', () => {
      expect(() => eligibleToRetire(emp('1970-01-01', '2000-01-01'), '2024-02-30')).toThrow()
    })

    it('throws on a partial date string', () => {
      expect(() => eligibleToRetire(emp('1970-01-01', '2000-01-01'), '2024-01')).toThrow()
    })
  })
})

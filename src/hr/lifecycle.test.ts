import { describe, it, expect } from 'vitest'
import { isOnProbation } from './lifecycle'

describe('isOnProbation', () => {
  // Acceptance spot-checks from task spec
  it('returns true on day 30 (Jan 1 → Jan 31)', () => {
    expect(isOnProbation('2026-01-01', '2026-01-31')).toBe(true)
  })

  it('returns true on day 59 (Jan 1 → Mar 1)', () => {
    expect(isOnProbation('2026-01-01', '2026-03-01')).toBe(true)
  })

  it('returns false on day 120 (Jan 1 → May 1)', () => {
    expect(isOnProbation('2026-01-01', '2026-05-01')).toBe(false)
  })

  // Boundary conditions
  it('returns true on the hire date itself (day 0)', () => {
    expect(isOnProbation('2026-06-15', '2026-06-15')).toBe(true)
  })

  it('returns true on exactly day 90 (Jan 1 → Apr 1)', () => {
    // Jan(31) + Feb(28) + Mar(31) = 90 days after Jan 1
    expect(isOnProbation('2026-01-01', '2026-04-01')).toBe(true)
  })

  it('returns false on day 91 (Jan 1 → Apr 2)', () => {
    expect(isOnProbation('2026-01-01', '2026-04-02')).toBe(false)
  })

  it('returns true on day 1', () => {
    expect(isOnProbation('2026-03-10', '2026-03-11')).toBe(true)
  })

  // Validation: malformed hireDate
  it('throws on a non-ISO hireDate', () => {
    expect(() => isOnProbation('01/01/2026', '2026-01-31')).toThrow()
  })

  it('throws on an invalid calendar hireDate', () => {
    expect(() => isOnProbation('2026-13-01', '2026-01-31')).toThrow()
  })

  it('throws on an empty hireDate', () => {
    expect(() => isOnProbation('', '2026-01-31')).toThrow()
  })

  // Validation: malformed asOf
  it('throws on a non-ISO asOf', () => {
    expect(() => isOnProbation('2026-01-01', 'January 31 2026')).toThrow()
  })

  it('throws on an invalid calendar asOf', () => {
    expect(() => isOnProbation('2026-01-01', '2026-02-30')).toThrow()
  })

  it('throws on an empty asOf', () => {
    expect(() => isOnProbation('2026-01-01', '')).toThrow()
  })
})

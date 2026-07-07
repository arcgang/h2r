export interface Employee {
  birthDate: string
  hireDate: string
  [key: string]: unknown
}

// Validates YYYY-MM-DD and returns a UTC-midnight Date; throws on malformed input.
export function parseDate(dateStr: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new RangeError(`Invalid date: "${dateStr}"`)
  }
  const [year, month, day] = dateStr.split('-').map(Number)
  if (month < 1 || month > 12) {
    throw new RangeError(`Invalid date: "${dateStr}"`)
  }
  const d = new Date(Date.UTC(year, month - 1, day))
  if (d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    throw new RangeError(`Invalid date: "${dateStr}"`)
  }
  return d
}

function wholeYearsBetween(from: Date, to: Date): number {
  let years = to.getUTCFullYear() - from.getUTCFullYear()
  const monthDiff = to.getUTCMonth() - from.getUTCMonth()
  const dayDiff = to.getUTCDate() - from.getUTCDate()
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    years--
  }
  return years
}

export function eligibleToRetire(employee: Employee, asOf: string): boolean {
  const asOfDate = parseDate(asOf)
  const birthDate = parseDate(employee.birthDate)
  const hireDate = parseDate(employee.hireDate)

  const age = wholeYearsBetween(birthDate, asOfDate)
  const tenure = wholeYearsBetween(hireDate, asOfDate)

  return age >= 65 || (age >= 55 && tenure >= 10)
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function parseUTCDate(dateStr: string): Date {
  if (!ISO_DATE_RE.test(dateStr)) {
    throw new RangeError(`Invalid date string: "${dateStr}"`)
  }
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  // Verify the parsed date matches the input to catch invalid calendar dates (e.g. Feb 30, month 13)
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    throw new RangeError(`Invalid calendar date: "${dateStr}"`)
  }
  return d
}

export function isOnProbation(hireDate: string, asOf: string): boolean {
  const hire = parseUTCDate(hireDate)
  const as = parseUTCDate(asOf)
  const diffMs = as.getTime() - hire.getTime()
  const diffDays = Math.round(diffMs / 86_400_000)
  return diffDays >= 0 && diffDays <= 90
}

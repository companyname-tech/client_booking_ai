/**
 * Real-time helpers — thin wrappers over `Date` so relative timestamps render
 * from the actual clock.
 */
export const NOW = Date.now()

export const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString()
export const hoursAgo = (h: number) => minutesAgo(h * 60)
export const daysAgo = (d: number) => hoursAgo(d * 24)
export const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString()

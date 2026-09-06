/**
 * Mock data is anchored to a fixed "now" so relative timestamps render
 * deterministically. Replace with real server timestamps later.
 */
export const NOW = new Date('2026-09-03T02:40:00+06:00').getTime()

export const minutesAgo = (m: number) => new Date(NOW - m * 60_000).toISOString()
export const hoursAgo = (h: number) => minutesAgo(h * 60)
export const daysAgo = (d: number) => hoursAgo(d * 24)
export const daysFromNow = (d: number) => new Date(NOW + d * 86_400_000).toISOString()

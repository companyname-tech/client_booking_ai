/** Verification pipeline bucket for lead list filtering (mirrors legacy CRM groups). */
export type LeadVerificationGroup = 'all' | 'new' | 'approved' | 'rejected'

export const LEAD_VERIFICATION_SECTIONS: { id: LeadVerificationGroup; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

export function leadVerificationGroup(verificationStatus?: string): Exclude<LeadVerificationGroup, 'all'> {
  const v = (verificationStatus || '').toUpperCase()
  if (v === 'REJECTED' || v === 'FAILED') return 'rejected'
  if (v === 'APPROVED' || v === 'VERIFIED') return 'approved'
  return 'new'
}

export function verificationGroupLabel(status?: string): string {
  const v = (status || '').toUpperCase()
  if (!v || v === 'UNVERIFIED') return 'Unverified'
  return v
    .split('_')
    .filter(Boolean)
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(' ')
}

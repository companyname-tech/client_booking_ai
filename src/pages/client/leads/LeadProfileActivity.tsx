import { useLeadProfile } from './LeadProfileLayout'
import { LeadActivityTimeline } from '@/components/leads/profile/LeadActivityTimeline'
import { repo } from '@/data/repository'
import { Reveal } from '@/components/motion/Reveal'

export default function LeadProfileActivity() {
  const { profile } = useLeadProfile()
  const notes = repo.getLeadNotes(profile.lead.id)

  const noteItems = notes.map((n) => ({
    id: n.id,
    type: 'note' as const,
    title: 'Client note',
    description: n.text,
    timestamp: n.createdAt,
    group: 'Notes',
  }))

  const allActivity = [...profile.activity, ...noteItems].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  return (
    <Reveal className="surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-fg">Lead activity</h2>
      <p className="mt-1 text-sm text-fg-muted">Complete timeline of discovery, outreach, and engagement.</p>
      <div className="mt-6">
        <LeadActivityTimeline items={allActivity} />
      </div>
    </Reveal>
  )
}

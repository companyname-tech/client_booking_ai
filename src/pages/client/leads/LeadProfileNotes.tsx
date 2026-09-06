import { useLeadProfile } from './LeadProfileLayout'
import { LeadNotesPanel } from '@/components/leads/profile/LeadNotesPanel'
import { Reveal } from '@/components/motion/Reveal'

export default function LeadProfileNotes() {
  const { profile } = useLeadProfile()

  return (
    <Reveal className="surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-fg">Notes</h2>
      <p className="mt-1 text-sm text-fg-muted">Add context and follow-up reminders for this prospect.</p>
      <div className="mt-6">
        <LeadNotesPanel leadId={profile.lead.id} />
      </div>
    </Reveal>
  )
}

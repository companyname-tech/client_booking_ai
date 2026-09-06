import { useLeadProfile } from './LeadProfileLayout'
import { LeadConversationHistory } from '@/components/leads/profile/LeadConversationHistory'
import { Reveal } from '@/components/motion/Reveal'

export default function LeadProfileConversations() {
  const { profile } = useLeadProfile()

  return (
    <Reveal className="surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-fg">Conversation history</h2>
      <p className="mt-1 text-sm text-fg-muted">All AI conversations for this prospect.</p>
      <div className="mt-6">
        <LeadConversationHistory conversations={profile.conversations} />
      </div>
    </Reveal>
  )
}

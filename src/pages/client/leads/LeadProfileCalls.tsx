import { useState } from 'react'
import { useLeadProfile } from './LeadProfileLayout'
import { LeadCallHistory, LeadRecordingsList } from '@/components/leads/profile/LeadCallHistory'
import { CallDrawer } from '@/components/calls/CallDrawer'
import { RecordingPlayer } from '@/components/recordings/RecordingPlayer'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { repo } from '@/data/repository'
import { Reveal } from '@/components/motion/Reveal'

export default function LeadProfileCalls() {
  const { profile } = useLeadProfile()
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null)
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null)

  const detail = selectedCallId ? repo.getCall(profile.lead.campaignId, selectedCallId) : null
  const recording = profile.recordings.find((r) => r.id === selectedRecordingId)

  return (
    <div className="space-y-6">
      <Reveal className="surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-fg">Call history</h2>
        <div className="mt-6">
          <LeadCallHistory calls={profile.calls} onSelect={setSelectedCallId} />
        </div>
      </Reveal>

      <Reveal className="surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-fg">Recordings</h2>
        <div className="mt-6">
          <LeadRecordingsList recordings={profile.recordings} onSelect={setSelectedRecordingId} />
        </div>
      </Reveal>

      <CallDrawer
        call={detail ?? null}
        lead={profile.lead}
        open={!!selectedCallId}
        onClose={() => setSelectedCallId(null)}
      />

      <DetailDrawer
        open={!!recording}
        onClose={() => setSelectedRecordingId(null)}
        title="Recording"
        subtitle={profile.lead.name}
      >
        {recording && (
          <div className="space-y-4 p-5">
            <RecordingPlayer durationSec={recording.durationSec} />
            <p className="text-sm text-fg-secondary">{recording.summary}</p>
          </div>
        )}
      </DetailDrawer>
    </div>
  )
}

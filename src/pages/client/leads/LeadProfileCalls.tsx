import { useState } from 'react'
import { useLeadProfile } from './LeadProfileLayout'
import { LeadCallHistory, LeadRecordingsList } from '@/components/leads/profile/LeadCallHistory'
import { CallDrawer } from '@/components/calls/CallDrawer'
import { RecordingPlayer } from '@/components/recordings/RecordingPlayer'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { repo } from '@/data/repository'
import type { CallDetail } from '@/types'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Reveal } from '@/components/motion/Reveal'

export default function LeadProfileCalls() {
  const { profile } = useLeadProfile()
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null)
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null)

  const { data: detail, loading: detailLoading, error: detailError, reload: reloadDetail } = useAsyncData(
    () =>
      selectedCallId
        ? repo.getCall(profile.lead.offerCampaignId, selectedCallId)
        : Promise.resolve<CallDetail | null>(null),
    [profile.lead.offerCampaignId, selectedCallId],
  )

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

      {selectedCallId && detailLoading ? (
        <DetailDrawer open onClose={() => setSelectedCallId(null)} title="Call detail" subtitle={profile.lead.name}>
          <LoadingState rows={5} />
        </DetailDrawer>
      ) : selectedCallId && detailError ? (
        <DetailDrawer open onClose={() => setSelectedCallId(null)} title="Call detail" subtitle={profile.lead.name}>
          <ErrorState message={detailError} onRetry={reloadDetail} />
        </DetailDrawer>
      ) : (
        <CallDrawer
          call={detail ?? null}
          lead={profile.lead}
          open={!!selectedCallId}
          onClose={() => setSelectedCallId(null)}
        />
      )}

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

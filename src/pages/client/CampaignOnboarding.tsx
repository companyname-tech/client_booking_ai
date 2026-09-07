import { useParams } from 'react-router-dom'
import { repo } from '@/data/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { useCampaignDraft } from '@/hooks/useCampaignDraft'
import { OnboardingShell } from '@/components/onboarding/OnboardingShell'
import type { OfferCampaign } from '@/types'
import type { CampaignDraft } from '@/types/campaignDraft'

function campaignToDraftSeed(campaign: OfferCampaign): Partial<CampaignDraft> {
  const [ageMin = 30, ageMax = 60] = campaign.criteria.ageRange.split(/[–-]/).map((s) => Number(s.trim()))
  return {
    target: {
      campaignName: campaign.name,
      industries: campaign.criteria.industry.split(',').map((s) => s.trim()).filter(Boolean),
      companySize: campaign.criteria.companySize,
      geographies: campaign.criteria.location.split(',').map((s) => s.trim()).filter(Boolean),
      decisionMakers: campaign.criteria.decisionMakers,
      ageMin: Number.isFinite(ageMin) ? ageMin : 30,
      ageMax: Number.isFinite(ageMax) ? ageMax : 60,
      additionalCriteria: campaign.criteria.other ?? '',
    },
    offer: {
      offerName: campaign.offerName,
      description: '',
      benefits: [],
      pitch: '',
    },
    budget: {
      total: campaign.budget.total,
      daily: campaign.budget.daily,
      durationDays: campaign.budget.expectedDurationDays,
    },
  }
}

export default function CampaignOnboarding() {
  const { id } = useParams()
  const { data: existing, loading, error, reload } = useAsyncData(
    () => (id ? repo.getCampaign(id) : Promise.resolve(undefined)),
    [id],
  )

  if (loading) return <LoadingState rows={6} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  return <OnboardingEditor existing={existing ?? undefined} />
}

function OnboardingEditor({ existing }: { existing?: OfferCampaign }) {
  const draftHook = useCampaignDraft({
    skipRestore: !!existing,
    initial: existing ? campaignToDraftSeed(existing) : undefined,
  })

  const handleSubmit = async (draft: CampaignDraft) => {
    const campaign = await repo.createCampaignFromDraft(draft)
    return campaign.id
  }

  return (
    <OnboardingShell
      draftHook={draftHook}
      onSubmit={handleSubmit}
      editMode={!!existing}
      backHref={existing ? `/client/campaigns/${existing.id}` : '/client/campaigns'}
    />
  )
}

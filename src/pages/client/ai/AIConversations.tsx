import { useState } from 'react'
import { repo } from '@/data/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { Input } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'
import { ActiveConversationCard } from '@/components/ai/AIActivityStream'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { MessageSquare } from 'lucide-react'

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'booked', label: 'Booked' },
  { id: 'interested', label: 'Interested' },
  { id: 'follow-up', label: 'Follow-up' },
  { id: 'high-intent', label: 'High Intent' },
  { id: 'objection', label: 'Objection' },
  { id: 'review', label: 'Needs Review' },
] as const

export default function AIConversations() {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<string>('all')

  const { data: overview, loading: overviewLoading, error: overviewError, reload: overviewReload } = useAsyncData(() => repo.getAIOverview(), [])

  const { data: conversationsData, loading, error, reload } = useAsyncData(
    () => repo.getAIConversations({ search, tab: tab === 'all' ? undefined : tab }),
    [search, tab],
  )

  if (overviewLoading || loading) return <LoadingState rows={6} />
  if (overviewError) return <ErrorState message={overviewError} onRetry={overviewReload} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  if (overview?.availability === 'pre_launch') {
    return <EmptyState icon={<MessageSquare className="size-8 text-fg-muted" />} title="No conversations yet" description="Conversations will appear once your campaign launches." />
  }

  const conversations = conversationsData ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search lead, company, keyword…" className="sm:max-w-sm" />
      </div>
      <Tabs items={FILTER_TABS.map((t) => ({ id: t.id, label: t.label }))} value={tab} onChange={setTab} aria-label="Conversation filters" />
      {conversations.length === 0 ? (
        <EmptyState title="No conversations match" description="Try adjusting your search or filters." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {conversations.map((c) => <ActiveConversationCard key={c.id} conversation={c} />)}
        </div>
      )}
      {search && (
        <p className="text-xs text-fg-muted">
          Showing {conversations.length} results for &ldquo;{search}&rdquo;
          {search.toLowerCase().includes('agency') && ' — conversations containing "agency"'}
        </p>
      )}
    </div>
  )
}

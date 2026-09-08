import { useState } from 'react'
import { Link } from 'react-router-dom'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { GenerateLeadsModal } from '@/components/leads/hub/GenerateLeadsModal'

export default function AdminLeads() {
  const { data, loading, error, reload } = useAsyncData(() => Promise.all([repo.getAdminLeads(), repo.getCampaigns()]))
  const [search, set_search] = useState('')
  const [campaign_id, set_campaign_id] = useState('')
  const [order, set_order] = useState('newest')
  const [page, set_page] = useState(1)
  const [generating, set_generating] = useState(false)
  const campaigns = data?.[1] ?? []
  const all_leads = data?.[0] ?? []
  const filtered = all_leads.filter((lead) => (!campaign_id || lead.offerCampaignId === campaign_id) && `${lead.name} ${lead.company} ${lead.email ?? ''} ${lead.phone ?? ''} ${lead.campaignName}`.toLowerCase().includes(search.toLowerCase())).sort((left, right) => order === 'name' ? left.name.localeCompare(right.name) : order === 'score' ? right.score - left.score : right.createdAt.localeCompare(left.createdAt))
  const pages = Math.max(1, Math.ceil(filtered.length / 25))
  const current_page = Math.min(page, pages)
  const visible = filtered.slice((current_page - 1) * 25, current_page * 25)
  const groups = [...new Set(visible.map((lead) => lead.offerCampaignId))]
  return <PageContainer className="space-y-6">
    <PageHeader eyebrow={<WorkspaceEyebrow name="Super Admin" context="Leads" />} title="Leads" description={`${all_leads.length} leads across ${new Set(all_leads.map((lead) => lead.offerCampaignId)).size} campaigns.`} />
    <div className="surface flex flex-wrap gap-3 p-4"><Input aria-label="Search leads" placeholder="Search leads, company or contact" value={search} onChange={(event) => { set_search(event.target.value); set_page(1) }} className="max-w-sm" />
      <select aria-label="Campaign" className="max-w-xs rounded-md border border-line bg-surface-2 p-2 text-sm" value={campaign_id} onChange={(event) => { set_campaign_id(event.target.value); set_page(1) }}><option value="">All campaigns</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select>
      <select aria-label="Order leads" className="rounded-md border border-line bg-surface-2 p-2 text-sm" value={order} onChange={(event) => { set_order(event.target.value); set_page(1) }}><option value="newest">Newest first</option><option value="name">Name</option><option value="score">Highest score</option></select>
      <Button onClick={() => void reload()}>Refresh</Button><Button variant="primary" disabled={!campaigns.length} onClick={() => set_generating(true)}>Generate leads</Button>
    </div>
    {loading ? <LoadingState rows={8} /> : error ? <ErrorState message={error} onRetry={reload} /> : !filtered.length ? <EmptyState title="No leads found" description="Adjust your filters or generate leads into a campaign." /> : <>
      {groups.map((id) => <section key={id || 'unassigned'} className="surface overflow-hidden"><div className="flex justify-between gap-3 border-b border-line p-4"><h2 className="font-semibold">{campaigns.find((campaign) => campaign.id === id)?.name ?? visible.find((lead) => lead.offerCampaignId === id)?.campaignName ?? 'Unassigned campaign'}</h2><span className="text-sm text-fg-muted">{filtered.filter((lead) => lead.offerCampaignId === id).length} matching leads</span></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-fg-muted"><tr>{['Lead', 'Contact', 'Status', 'Score', 'Last outcome', 'Verification'].map((label) => <th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{visible.filter((lead) => lead.offerCampaignId === id).map((lead) => <tr className="border-t border-line" key={lead.id}><td className="p-3"><Link className="text-accent" to={`/admin/campaigns/${lead.offerCampaignId}/leads`}>{lead.name}</Link><p className="text-fg-muted">{lead.company}</p></td><td className="p-3">{lead.email && <a className="block" href={`mailto:${lead.email}`}>{lead.email}</a>}{lead.phone && <a href={`tel:${lead.phone}`}>{lead.phone}</a>}</td><td className="p-3">{lead.status.replaceAll('_', ' ')}</td><td className="p-3">{lead.score}</td><td className="p-3">{lead.lastCallOutcome || '—'}</td><td className="p-3">{lead.verificationStatus || '—'}</td></tr>)}</tbody></table></div></section>)}
      <div className="flex justify-between gap-3"><p className="text-sm text-fg-muted">{filtered.length} matching leads · Page {current_page} of {pages}</p><div className="flex gap-2"><Button disabled={current_page <= 1} onClick={() => set_page(current_page - 1)}>Previous</Button><Button disabled={current_page >= pages} onClick={() => set_page(current_page + 1)}>Next</Button></div></div>
    </>}
    <GenerateLeadsModal open={generating} onClose={() => set_generating(false)} campaigns={campaigns} onGenerated={reload} />
  </PageContainer>
}

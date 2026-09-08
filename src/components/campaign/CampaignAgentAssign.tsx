import { useState } from 'react'
import { ChevronRight, Plus, UserPlus } from 'lucide-react'
import { repo } from '@/api/repository'
import type { Agent, OfferCampaign } from '@/types'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { FieldLabel } from '@/components/ui/Field'
import { cn } from '@/lib/utils'

type AssignMode = 'choose' | 'select' | 'create'

export function CampaignAgentAssign({
  campaign,
  agents,
  open,
  onOpenChange,
  onAssigned,
}: {
  campaign: OfferCampaign
  agents: Agent[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onAssigned: (next: OfferCampaign) => void
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const modalOpen = open ?? internalOpen
  const setModalOpen = onOpenChange ?? setInternalOpen
  const [mode, setMode] = useState<AssignMode>('choose')
  const [selectedId, setSelectedId] = useState(campaign.agentId)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const resetModal = () => {
    setMode('choose')
    setSelectedId(campaign.agentId)
    setNewName('')
    setError('')
    setBusy(false)
  }

  const close = () => {
    setModalOpen(false)
    resetModal()
  }

  const assignAgent = async (agentId: string) => {
    if (!agentId) {
      setError('Choose an agent to assign.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const next = await repo.updateCampaignOffer(campaign.id, { agentId })
      onAssigned(next)
      close()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to assign agent')
    } finally {
      setBusy(false)
    }
  }

  const createAndAssign = async () => {
    const name = newName.trim()
    if (!name) {
      setError('Enter a name for the new agent.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const created = await repo.createAgent({ name })
      const next = await repo.updateCampaignOffer(campaign.id, { agentId: created.id })
      onAssigned(next)
      close()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create agent')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Modal
        open={modalOpen}
        onClose={close}
        size="sm"
        title={mode === 'create' ? 'Create agent' : mode === 'select' ? 'Select agent' : 'Assign agent'}
        description={
          mode === 'choose'
            ? 'Choose an existing agent or create a new one for this campaign.'
            : mode === 'select'
              ? 'Pick the agent that will run calls for this campaign.'
              : 'Create a new agent and assign it to this campaign.'
        }
        footer={
          mode === 'choose' ? (
            <Button variant="ghost" onClick={close}>Cancel</Button>
          ) : mode === 'select' ? (
            <>
              <Button variant="ghost" onClick={() => setMode('choose')} disabled={busy}>Back</Button>
              <Button variant="primary" onClick={() => void assignAgent(selectedId)} disabled={busy || !selectedId}>
                {busy ? 'Assigning…' : 'Assign agent'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setMode('choose')} disabled={busy}>Back</Button>
              <Button variant="primary" onClick={() => void createAndAssign()} disabled={busy || !newName.trim()}>
                {busy ? 'Creating…' : 'Create & assign'}
              </Button>
            </>
          )
        }
      >
        <div className="space-y-4 px-5 py-4">
          {mode === 'choose' && (
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => setMode('select')}
                className={cn(
                  'interactive flex items-center justify-between rounded-md border border-line bg-surface-2 px-4 py-3 text-left hover:border-line-strong hover:bg-surface-3',
                )}
              >
                <div className="flex items-center gap-3">
                  <UserPlus className="size-4 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-fg">Select existing</p>
                    <p className="text-xs text-fg-muted">Choose from agents already in the workspace</p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-fg-muted" />
              </button>
              <button
                type="button"
                onClick={() => setMode('create')}
                className={cn(
                  'interactive flex items-center justify-between rounded-md border border-line bg-surface-2 px-4 py-3 text-left hover:border-line-strong hover:bg-surface-3',
                )}
              >
                <div className="flex items-center gap-3">
                  <Plus className="size-4 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-fg">Create new</p>
                    <p className="text-xs text-fg-muted">Add a fresh agent and assign it here</p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-fg-muted" />
              </button>
            </div>
          )}

          {mode === 'select' && (
            <div>
              <FieldLabel htmlFor="campaign-agent-select" required>Agent</FieldLabel>
              <Select
                id="campaign-agent-select"
                value={selectedId}
                onChange={setSelectedId}
                ariaLabel="Agent"
                placeholder="Choose an agent…"
                options={[
                  { value: '', label: 'Choose an agent…' },
                  ...agents.map((a) => ({ value: a.id, label: a.name || a.id })),
                ]}
                className="w-full"
              />
            </div>
          )}

          {mode === 'create' && (
            <div>
              <FieldLabel htmlFor="campaign-new-agent-name" required>Agent name</FieldLabel>
              <Input
                id="campaign-new-agent-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. avi"
                autoFocus
              />
            </div>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      </Modal>
    </>
  )
}

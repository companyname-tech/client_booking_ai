import { Settings } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { SchemaSettingsCard } from '@/components/settings/SchemaSettingsCard'
import { isLeadsRuntimeSetting } from '@/components/settings/settingsFieldGroups'

export interface LeadsSettingsModalProps {
  open: boolean
  onClose: () => void
}

/** Lead-generation job budgets and bulk verification limits (moved off Settings → Application). */
export function LeadsSettingsModal({ open, onClose }: LeadsSettingsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      fitContent
      title="Lead settings"
      description="Limits for lead generation jobs and bulk verification. Saved to the database; changes apply to new runs immediately unless marked restart required."
    >
      <SchemaSettingsCard
        title="Generation & verification limits"
        description="Platform-wide defaults for discovery jobs and verification throughput."
        filter={(f) => isLeadsRuntimeSetting(f.name)}
      />
    </Modal>
  )
}

export function LeadsSettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Lead generation and verification limits"
      className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-fg-secondary transition-colors hover:border-line-strong hover:text-fg"
    >
      <Settings className="size-3.5" />
      Lead settings
    </button>
  )
}

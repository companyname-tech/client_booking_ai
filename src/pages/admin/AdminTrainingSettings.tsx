import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { TrainingSettingsPanel } from '@/components/settings/TrainingSettingsPanel'

export default function AdminTrainingSettings() {
  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name="Super Admin" context="AI Training" />}
          title="Training settings"
          description="Agent learning, live memory retrieval, semantic confidence gates, and call orchestrator behavior."
          actions={
            <Link to="/admin/ai-training">
              <Button variant="secondary" size="sm" leadingIcon={<ArrowLeft className="size-3.5" />}>
                Back to workspace
              </Button>
            </Link>
          }
        />

        <TrainingSettingsPanel />
      </PageContainer>
    </PageTransition>
  )
}

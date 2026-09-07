import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { PronunciationLexicon } from '@/components/admin/PronunciationLexicon'
import { Reveal } from '@/components/motion/Reveal'

export default function AdminAITraining() {
  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name="Super Admin" context="AI Training" />}
          title="AI training workspace"
          description="Train and configure agents — pronunciation and model settings."
        />
        <Reveal>
          <PronunciationLexicon />
        </Reveal>
      </PageContainer>
    </PageTransition>
  )
}

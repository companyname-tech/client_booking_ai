import { SchemaSettingsCard } from './SchemaSettingsCard'
import { TRAINING_SETTING_GROUPS } from './settingsFieldGroups'

/**
 * Standalone training runtime settings — rendered on the AI training settings
 * page, not inside the general Settings tabs.
 */
export function TrainingSettingsPanel() {
  return (
    <div className="space-y-6">
      {TRAINING_SETTING_GROUPS.map((group) => (
        <SchemaSettingsCard
          key={group.id}
          title={group.title}
          description={group.description}
          filter={(f) => group.fields.includes(f.name)}
        />
      ))}
    </div>
  )
}

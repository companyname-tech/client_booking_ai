import { useState } from 'react'
import { motion } from 'motion/react'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'

const STAGES = [
  'Analyzing offer',
  'Analyzing target audience',
  'Generating conversation strategy',
  'Generating objections',
  'Generating qualification logic',
  'Preparing booking behavior',
  'Running simulation',
  'Training complete',
]

export function AITrainingPanel({ onComplete }: { onComplete: (score: number) => void }) {
  const [running, setRunning] = useState(false)
  const [stage, setStage] = useState(0)
  const [done, setDone] = useState(false)
  const [score, setScore] = useState(0)

  const start = () => {
    setRunning(true)
    setStage(0)
    setDone(false)
    let i = 0
    const interval = window.setInterval(() => {
      i++
      setStage(i)
      if (i >= STAGES.length - 1) {
        window.clearInterval(interval)
        const s = 92 + Math.floor(Math.random() * 6)
        setScore(s)
        setDone(true)
        setRunning(false)
        onComplete(s)
      }
    }, 350)
  }

  return (
    <div className="surface p-5">
      <h3 className="text-sm font-semibold text-fg">Train AI Agent</h3>
      {!running && !done && (
        <Button variant="primary" className="mt-4" onClick={start}>Start Training</Button>
      )}
      {(running || done) && (
        <div className="mt-4 space-y-3">
          <ProgressBar value={((stage + 1) / STAGES.length) * 100} tone="violet" label="Training progress" />
          <ul className="space-y-2">
            {STAGES.map((s, i) => (
              <motion.li
                key={s}
                initial={{ opacity: 0 }}
                animate={{ opacity: i <= stage ? 1 : 0.3 }}
                className="flex items-center gap-2 text-sm"
              >
                {i < stage || done ? <Check className="size-4 text-success" /> : i === stage && running ? <Loader2 className="size-4 animate-spin text-violet" /> : <span className="size-4" />}
                <span className={i <= stage ? 'text-fg' : 'text-fg-muted'}>{s}</span>
              </motion.li>
            ))}
          </ul>
          {done && <p className="text-sm font-medium text-success">Training score: {score}%</p>}
        </div>
      )}
    </div>
  )
}

const SIM_MESSAGES = [
  { speaker: 'prospect', text: "I'm interested, but I'm not sure this is relevant for my company." },
  { speaker: 'ai', text: 'Absolutely. Can I ask how you\'re currently handling lead generation and booking qualified meetings?' },
  { speaker: 'prospect', text: "We rely mostly on referrals right now, but we're looking to scale." },
  { speaker: 'ai', text: "That's exactly what we help firms like yours with. Would a 30-minute strategy session make sense?" },
  { speaker: 'prospect', text: 'Yes, send me some times for next week.' },
]

export function AISimulation() {
  const [running, setRunning] = useState(false)
  const [visible, setVisible] = useState(0)

  const run = () => {
    setRunning(true)
    setVisible(0)
    let i = 0
    const interval = window.setInterval(() => {
      i++
      setVisible(i)
      if (i >= SIM_MESSAGES.length) {
        window.clearInterval(interval)
        setRunning(false)
      }
    }, 800)
  }

  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-fg">Run Conversation Simulation</h3>
        <Button variant="secondary" size="sm" onClick={run} disabled={running}>Run</Button>
      </div>
      <div className="mt-4 space-y-3">
        {SIM_MESSAGES.slice(0, visible).map((m, i) => (
          <div key={i} className={`text-sm ${m.speaker === 'ai' ? 'text-violet' : 'text-fg-secondary'}`}>
            <span className="text-2xs font-semibold uppercase">{m.speaker === 'ai' ? 'AI' : 'Prospect'}: </span>
            {m.text}
          </div>
        ))}
      </div>
      {visible >= SIM_MESSAGES.length && (
        <dl className="mt-4 grid grid-cols-2 gap-2 rounded-md border border-line bg-surface-1 p-3 text-xs">
          <div><dt className="text-fg-muted">Intent</dt><dd className="font-medium text-violet">Interested</dd></div>
          <div><dt className="text-fg-muted">Objection</dt><dd>Relevance</dd></div>
          <div><dt className="text-fg-muted">Qualification</dt><dd>Qualified</dd></div>
          <div><dt className="text-fg-muted">Action</dt><dd>Continue conversation</dd></div>
        </dl>
      )}
    </div>
  )
}

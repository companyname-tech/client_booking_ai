import { useCallback, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { AlertCircle, Film, Loader2, Play, RefreshCw, Trash2, Upload } from 'lucide-react'
import type { VideoAsset } from '@/types/campaignDraft'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'

const MAX_BYTES = 15 * 1024 * 1024
const ACCEPTED = ['video/mp4', 'video/quicktime', 'video/webm']
const ACCEPTED_EXT = ['.mp4', '.mov', '.webm']

export type VideoUploadState =
  | 'empty'
  | 'dragging'
  | 'uploading'
  | 'uploaded'
  | 'too_large'
  | 'wrong_format'
  | 'wrong_orientation'
  | 'failed'
  | 'replacing'

export interface VideoUploaderProps {
  value?: VideoAsset
  onChange: (video: VideoAsset | undefined) => void
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

async function readVideoMeta(file: File): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      resolve({ duration: video.duration, width: video.videoWidth, height: video.videoHeight })
      URL.revokeObjectURL(url)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('metadata'))
    }
    video.src = url
  })
}

export function VideoUploader({ value, onChange }: VideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<VideoUploadState>(value ? 'uploaded' : 'empty')
  const [progress, setProgress] = useState(100)
  const [errorMsg, setErrorMsg] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const simulateUpload = useCallback(
    (file: File, meta: { duration: number; width: number; height: number }) => {
      setState('uploading')
      setProgress(0)
      let p = 0
      const interval = window.setInterval(() => {
        p += 8 + Math.random() * 12
        if (p >= 100) {
          window.clearInterval(interval)
          setProgress(100)
          const asset: VideoAsset = {
            name: file.name,
            size: file.size,
            durationSec: meta.duration,
            resolution: `${meta.width}×${meta.height}`,
            mimeType: file.type,
            previewUrl: URL.createObjectURL(file),
          }
          onChange(asset)
          setState('uploaded')
          setPendingFile(null)
        } else {
          setProgress(Math.round(p))
        }
      }, 120)
    },
    [onChange],
  )

  const processFile = useCallback(
    async (file: File) => {
      setErrorMsg('')
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
      if (!ACCEPTED.includes(file.type) && !ACCEPTED_EXT.includes(ext)) {
        setState('wrong_format')
        setErrorMsg('Please upload an MP4, MOV, or WebM video.')
        return
      }
      if (file.size > MAX_BYTES) {
        setState('too_large')
        setErrorMsg(`This video is ${formatSize(file.size)}. Maximum allowed size is 15 MB.`)
        return
      }
      try {
        const meta = await readVideoMeta(file)
        const isVertical = meta.height > meta.width
        const nameHintsVertical = /vertical|portrait|9x16|916/i.test(file.name)
        if (!isVertical && !nameHintsVertical) {
          setState('wrong_orientation')
          setErrorMsg('Please upload a vertical video.')
          setPendingFile(file)
          return
        }
        setPendingFile(file)
        simulateUpload(file, meta)
      } catch {
        setState('failed')
        setErrorMsg('Could not read this video. Try a different file.')
      }
    },
    [simulateUpload],
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) void processFile(file)
  }

  const remove = () => {
    if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl)
    onChange(undefined)
    setState('empty')
    setProgress(0)
    setPendingFile(null)
    setErrorMsg('')
  }

  const isError = ['too_large', 'wrong_format', 'wrong_orientation', 'failed'].includes(state)

  if (state === 'uploaded' && value) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative mx-auto aspect-[9/16] w-[140px] shrink-0 overflow-hidden rounded-lg border border-line-strong bg-surface-3 shadow-2 sm:mx-0">
            {value.previewUrl ? (
              <video src={value.previewUrl} className="size-full object-cover" muted playsInline />
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-b from-surface-3 to-surface-1">
                <Film className="size-8 text-fg-muted" />
              </div>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="flex size-10 items-center justify-center rounded-full bg-white/90 text-bg shadow-lg">
                <Play className="ml-0.5 size-4" fill="currentColor" />
              </span>
            </span>
            <span className="absolute bottom-2 right-2 rounded-sm bg-black/70 px-1.5 py-0.5 text-2xs font-medium text-white tabular">
              {formatDuration(value.durationSec)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg">{value.name}</p>
            <dl className="mt-2 space-y-1 text-xs text-fg-muted">
              <div className="flex justify-between gap-4">
                <dt>Size</dt>
                <dd className="tabular text-fg-secondary">{formatSize(value.size)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Duration</dt>
                <dd className="tabular text-fg-secondary">{formatDuration(value.durationSec)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Resolution</dt>
                <dd className="tabular text-fg-secondary">{value.resolution}</dd>
              </div>
            </dl>
            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                leadingIcon={<RefreshCw />}
                onClick={() => {
                  setState('replacing')
                  inputRef.current?.click()
                }}
              >
                Replace
              </Button>
              <Button variant="ghost" size="sm" leadingIcon={<Trash2 />} onClick={remove}>
                Remove
              </Button>
            </div>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void processFile(f)
            e.target.value = ''
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
          setState(value ? 'replacing' : 'dragging')
        }}
        onDragLeave={() => {
          setDragOver(false)
          if (!isError && state !== 'uploading') setState(value ? 'uploaded' : 'empty')
        }}
        onDrop={onDrop}
        onClick={() => state !== 'uploading' && inputRef.current?.click()}
        className={cn(
          'interactive relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center outline-none transition-colors',
          dragOver ? 'border-accent bg-accent-soft/30' : 'border-line-strong bg-surface-1 hover:border-accent/40',
          isError && 'border-danger/40 bg-danger-soft/20',
        )}
      >
        {state === 'uploading' ? (
          <>
            <Loader2 className="size-8 animate-spin text-accent" />
            <p className="mt-3 text-sm font-medium text-fg">Uploading…</p>
            <ProgressBar value={progress} tone="info" className="mt-4 w-full max-w-xs" label="Upload progress" />
            <p className="mt-2 text-xs tabular text-fg-muted">{progress}%</p>
          </>
        ) : isError ? (
          <>
            <AlertCircle className="size-8 text-danger" />
            <p className="mt-3 text-sm font-medium text-fg">
              {state === 'too_large' ? 'File is too large' : state === 'wrong_format' ? 'Unsupported format' : state === 'wrong_orientation' ? 'Please upload a vertical video' : 'Upload failed'}
            </p>
            <p className="mt-1 max-w-sm text-xs text-fg-muted">{errorMsg}</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={(e) => { e.stopPropagation(); setState('empty'); setErrorMsg('') }}>
              Try again
            </Button>
          </>
        ) : (
          <>
            <motion.div animate={{ y: dragOver ? -4 : 0 }} transition={{ duration: 0.2 }}>
              <Upload className="mx-auto size-8 text-fg-muted" />
            </motion.div>
            <p className="mt-3 text-sm font-medium text-fg">Drop your offer video here</p>
            <p className="mt-1 text-xs text-fg-muted">Vertical video · Max 15 MB · MP4, MOV, WebM</p>
            <Button variant="secondary" size="sm" className="mt-4" type="button">
              Choose video
            </Button>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void processFile(f)
          e.target.value = ''
        }}
      />
      {pendingFile && state === 'uploading' && (
        <p className="text-xs text-fg-muted">
          {pendingFile.name} · {formatSize(pendingFile.size)}
        </p>
      )}
    </div>
  )
}

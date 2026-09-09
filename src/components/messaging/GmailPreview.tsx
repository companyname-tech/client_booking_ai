import { renderMessageTemplate } from '@/lib/renderMessageTemplate'
import type { MessagePreviewContext } from '@/types/messaging'

interface GmailPreviewProps {
  fromName: string
  fromAddress: string
  subject: string
  body: string
  previewContext: MessagePreviewContext
}

export function GmailPreview({ fromName, fromAddress, subject, body, previewContext }: GmailPreviewProps) {
  const renderedSubject = renderMessageTemplate(subject, previewContext)
  const renderedBody = renderMessageTemplate(body, previewContext)
  const fromLine = fromName ? `${fromName} <${fromAddress || 'sender@example.com'}>` : fromAddress || 'sender@example.com'

  return (
    <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#202124] shadow-lg">
      <div className="border-b border-white/[0.06] bg-[#2d2e30] px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-[#9aa0a6]">
          <span className="rounded bg-[#3c4043] px-2 py-0.5 font-medium text-[#e8eaed]">Gmail</span>
          <span>Preview</span>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <h3 className="text-lg font-normal text-[#e8eaed]">{renderedSubject || '(No subject)'}</h3>
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#5f6368] text-sm font-medium text-white">
            {(fromName || fromAddress || 'S').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm font-medium text-[#e8eaed]">{fromName || 'Sender'}</span>
              <span className="truncate text-xs text-[#9aa0a6]">&lt;{fromAddress || 'sender@example.com'}&gt;</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#e8eaed]">
              {renderedBody || 'Message body will appear here…'}
            </p>
          </div>
        </div>
        <p className="text-[10px] text-[#9aa0a6]">From: {fromLine}</p>
      </div>
    </div>
  )
}

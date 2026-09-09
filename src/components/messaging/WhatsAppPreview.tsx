import { renderMessageTemplate } from '@/lib/renderMessageTemplate'
import type { MessagePreviewContext } from '@/types/messaging'

interface WhatsAppPreviewProps {
  fromPhone: string
  body: string
  previewContext: MessagePreviewContext
}

export function WhatsAppPreview({ fromPhone, body, previewContext }: WhatsAppPreviewProps) {
  const rendered = renderMessageTemplate(body, previewContext)
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#0b141a] shadow-lg">
      <div className="flex items-center gap-3 border-b border-white/[0.06] bg-[#1f2c34] px-4 py-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-[#6b7c85] text-sm font-medium text-white">
          B
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#e9edef]">Business</p>
          <p className="truncate text-xs text-[#8696a0]">{fromPhone || '+1 555 000 0000'}</p>
        </div>
      </div>
      <div
        className="min-h-[200px] p-4"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, rgb(17 27 33 / 0.4) 0%, transparent 50%)',
          backgroundColor: '#0b141a',
        }}
      >
        <div className="ml-auto max-w-[85%]">
          <div className="rounded-lg rounded-tr-none bg-[#005c4b] px-3 py-2 shadow-sm">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#e9edef]">
              {rendered || 'Message will appear here…'}
            </p>
            <p className="mt-1 text-right text-[10px] text-[#99beb3]">{time}</p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/[0.06] bg-[#1f2c34] px-4 py-2 text-center text-[10px] text-[#8696a0]">
        WhatsApp preview
      </div>
    </div>
  )
}

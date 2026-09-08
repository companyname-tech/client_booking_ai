/** Copy text to the clipboard with modern API + execCommand fallback. */
export async function copyToClipboard(text: string): Promise<void> {
  const value = text.trim()
  if (!value) throw new Error('Nothing to copy')

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value)
      return
    } catch {
      // Fall through to execCommand.
    }
  }

  const textArea = document.createElement('textarea')
  textArea.value = value
  textArea.style.position = 'fixed'
  textArea.style.left = '-999999px'
  textArea.style.top = '-999999px'
  textArea.style.opacity = '0'
  textArea.setAttribute('readonly', '')
  document.body.appendChild(textArea)

  if (navigator.userAgent.match(/ipad|iphone/i)) {
    const range = document.createRange()
    range.selectNodeContents(textArea)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    textArea.setSelectionRange(0, 999999)
  } else {
    textArea.select()
    textArea.setSelectionRange(0, 999999)
  }

  const ok = document.execCommand('copy')
  document.body.removeChild(textArea)
  if (!ok) throw new Error('Clipboard copy is not supported in this browser')
}

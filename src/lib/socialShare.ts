import {
  buildLinkedInPost,
  buildShareUrls,
  buildXPost,
  linkedInFallbackUrl,
  toastCopy,
  type ShareFields,
} from '../config/shareText'
import { copyText } from './clipboard'
import { downloadDataUrl } from './exportCard'

export type SocialPlatform = 'linkedin' | 'x'

export interface SocialShareResult {
  toast: string
  copied: boolean
  opened: boolean
}

/**
 * Save the card PNG via download (avoids the system share sheet),
 * copy the platform post text, and open the composer in a new tab.
 */
export async function shareToSocial(opts: {
  platform: SocialPlatform
  fields: ShareFields
  dataUrl: string
  filename: string
}): Promise<SocialShareResult> {
  const { platform, fields, dataUrl, filename } = opts

  // Always download — reliably saves the image without opening a generic share sheet.
  downloadDataUrl(dataUrl, filename)

  const text =
    platform === 'linkedin' ? buildLinkedInPost(fields) : buildXPost(fields)
  const copied = await copyText(text)

  const urls = buildShareUrls(text)
  let opened = false
  try {
    const target = platform === 'linkedin' ? urls.linkedin : urls.x
    const win = window.open(target, '_blank', 'noopener,noreferrer')
    if (!win && platform === 'linkedin') {
      window.open(linkedInFallbackUrl(), '_blank', 'noopener,noreferrer')
    }
    opened = true
  } catch {
    if (platform === 'linkedin') {
      try {
        window.open(linkedInFallbackUrl(), '_blank', 'noopener,noreferrer')
        opened = true
      } catch {
        opened = false
      }
    }
  }

  return {
    toast: toastCopy[platform],
    copied,
    opened,
  }
}

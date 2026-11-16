import {
  buildLinkedInPost,
  buildOpenUrls,
  buildXPost,
  type ShareFields,
} from '../config/shareText'
import {
  canShareFiles,
  dataUrlToFile,
  downloadDataUrl,
  shareCardFile,
} from './exportCard'

export type SocialPlatform = 'linkedin' | 'x'

export function buildPostText(
  platform: SocialPlatform,
  fields: ShareFields,
): string {
  return platform === 'linkedin'
    ? buildLinkedInPost(fields)
    : buildXPost(fields)
}

export function getOpenUrl(platform: SocialPlatform, text: string): string {
  const urls = buildOpenUrls(text)
  return platform === 'linkedin' ? urls.linkedin : urls.x
}

export function canNativeShareImage(file?: File): boolean {
  if (!canShareFiles()) return false
  if (!file) return true
  try {
    return Boolean(navigator.canShare?.({ files: [file] }))
  } catch {
    return false
  }
}

export async function saveCardImage(opts: {
  dataUrl: string
  filename: string
  preferNativeShare: boolean
}): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const { dataUrl, filename, preferNativeShare } = opts
  const file = await dataUrlToFile(dataUrl, filename)

  if (preferNativeShare && canNativeShareImage(file)) {
    try {
      await shareCardFile(file, filename)
      return 'shared'
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled'
    }
  }

  downloadDataUrl(dataUrl, filename)
  return 'downloaded'
}

export async function shareImageToApp(opts: {
  dataUrl: string
  filename: string
  text: string
}): Promise<'shared' | 'unavailable' | 'cancelled'> {
  const file = await dataUrlToFile(opts.dataUrl, opts.filename)
  if (!canNativeShareImage(file)) return 'unavailable'
  try {
    const data = { files: [file], title: opts.filename, text: opts.text }
    if (!navigator.canShare?.(data)) {
      await navigator.share({ files: [file], title: opts.filename })
    } else {
      await navigator.share(data)
    }
    return 'shared'
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return 'cancelled'
    return 'unavailable'
  }
}

import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CardStudio } from './CardStudio'

/** Pitch Day page — Builder / Mentor / Judge. */
export default function App() {
  return <CardStudio mode="pitch" />
}

const ROBOTS_META = 'ideeza-team-robots'

/** /team — typed custom role for staff & partners (unlisted; direct URL only). */
export function TeamPage() {
  const [params] = useSearchParams()
  const initialCustomRole = useMemo(() => {
    const raw = params.get('role') ?? params.get('title') ?? ''
    return raw.trim().slice(0, 32)
  }, [params])

  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>(
      `meta[name="robots"][data-ideeza="${ROBOTS_META}"]`,
    )
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'robots'
      meta.dataset.ideeza = ROBOTS_META
      document.head.appendChild(meta)
    }
    meta.content = 'noindex, nofollow'
    const prevTitle = document.title
    document.title = "IDEEZA Builders' Lab 2.0 — Team card"
    return () => {
      meta?.remove()
      document.title = prevTitle
    }
  }, [])

  return (
    <CardStudio
      key={initialCustomRole || 'team'}
      mode="team"
      initialCustomRole={initialCustomRole}
    />
  )
}

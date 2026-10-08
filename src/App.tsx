import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CardStudio } from './CardStudio'

/** Pitch Day page — Builder / Mentor / Judge. */
export default function App() {
  return <CardStudio mode="pitch" />
}

/** /team — typed custom role for staff & partners. */
export function TeamPage() {
  const [params] = useSearchParams()
  const initialCustomRole = useMemo(() => {
    const raw = params.get('role') ?? params.get('title') ?? ''
    return raw.trim().slice(0, 32)
  }, [params])

  return (
    <CardStudio
      key={initialCustomRole || 'team'}
      mode="team"
      initialCustomRole={initialCustomRole}
    />
  )
}

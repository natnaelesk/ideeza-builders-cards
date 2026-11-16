import { useEffect, useRef, type Ref } from 'react'
import { CARD_HEIGHT, CARD_WIDTH } from '../config/event'
import { TEMPLATE_SRC } from '../config/badgeGeometry'
import { loadImage, paintBadge } from '../lib/drawBadge'
import type { CardFormState } from '../types'
import './ShareCard.css'

export interface ShareCardProps {
  state: CardFormState
  canvasRef?: Ref<HTMLCanvasElement>
  className?: string
}

export function ShareCard({ state, canvasRef, className }: ShareCardProps) {
  const localRef = useRef<HTMLCanvasElement | null>(null)
  const templateRef = useRef<HTMLImageElement | null>(null)
  const photoRef = useRef<HTMLImageElement | null>(null)

  const setRefs = (node: HTMLCanvasElement | null) => {
    localRef.current = node
    if (typeof canvasRef === 'function') canvasRef(node)
    else if (canvasRef && 'current' in canvasRef) {
      ;(canvasRef as { current: HTMLCanvasElement | null }).current = node
    }
  }

  useEffect(() => {
    let cancelled = false
    loadImage(TEMPLATE_SRC).then((img) => {
      if (!cancelled) {
        templateRef.current = img
        if (localRef.current) {
          void paintBadge(localRef.current, state, img, photoRef.current)
        }
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let cancelled = false
    const src =
      state.cutoutStatus === 'ready' && state.cutoutUrl
        ? state.cutoutUrl
        : state.photoUrl
    if (!src) {
      photoRef.current = null
      return
    }
    loadImage(src)
      .then((img) => {
        if (!cancelled) photoRef.current = img
      })
      .catch(() => {
        if (!cancelled) photoRef.current = null
      })
    return () => {
      cancelled = true
    }
  }, [state.photoUrl, state.cutoutUrl, state.cutoutStatus])

  useEffect(() => {
    const canvas = localRef.current
    const template = templateRef.current
    if (!canvas || !template) return
    let cancelled = false
    const run = async () => {
      if (
        (state.cutoutUrl || state.photoUrl) &&
        !photoRef.current &&
        state.cutoutStatus !== 'idle'
      ) {
        await new Promise((r) => setTimeout(r, 80))
      }
      if (cancelled || !localRef.current || !templateRef.current) return
      await paintBadge(
        localRef.current,
        state,
        templateRef.current,
        photoRef.current,
      )
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [state])

  return (
    <canvas
      ref={setRefs}
      className={`share-card${className ? ` ${className}` : ''}`}
      width={CARD_WIDTH}
      height={CARD_HEIGHT}
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      aria-label="Builder ID badge preview"
    />
  )
}

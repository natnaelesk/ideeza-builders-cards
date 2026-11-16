import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type Ref,
} from 'react'
import { CARD_HEIGHT, CARD_WIDTH } from '../config/event'
import { TEMPLATE_SRC } from '../config/badgeGeometry'
import { loadImage, paintBadge } from '../lib/drawBadge'
import type { CardFormState, PhotoTransform } from '../types'
import './ShareCard.css'

export interface ShareCardHandle {
  /** Live gesture/slider redraw — no React state required. */
  drawLive: (transform: PhotoTransform) => void
}

export interface ShareCardProps {
  state: CardFormState
  canvasRef?: Ref<HTMLCanvasElement>
  className?: string
}

export const ShareCard = forwardRef<ShareCardHandle, ShareCardProps>(
  function ShareCard({ state, canvasRef, className }, ref) {
    const localRef = useRef<HTMLCanvasElement | null>(null)
    const templateRef = useRef<HTMLImageElement | null>(null)
    const photoRef = useRef<HTMLImageElement | null>(null)
    const stateRef = useRef(state)
    stateRef.current = state

    const setRefs = (node: HTMLCanvasElement | null) => {
      localRef.current = node
      if (typeof canvasRef === 'function') canvasRef(node)
      else if (canvasRef && 'current' in canvasRef) {
        ;(canvasRef as { current: HTMLCanvasElement | null }).current = node
      }
    }

    const paint = (transform?: PhotoTransform) => {
      const canvas = localRef.current
      const template = templateRef.current
      if (!canvas || !template) return
      paintBadge(
        canvas,
        stateRef.current,
        template,
        photoRef.current,
        transform,
      )
    }

    useImperativeHandle(
      ref,
      () => ({
        drawLive: (transform: PhotoTransform) => {
          paint(transform)
        },
      }),
      // paint closes over refs — stable
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    )

    useEffect(() => {
      let cancelled = false
      loadImage(TEMPLATE_SRC).then((img) => {
        if (!cancelled) {
          templateRef.current = img
          paint()
        }
      })
      return () => {
        cancelled = true
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
      let cancelled = false
      if (!state.photoUrl) {
        photoRef.current = null
        paint()
        return
      }
      loadImage(state.photoUrl)
        .then((img) => {
          if (cancelled) return
          photoRef.current = img
          paint()
        })
        .catch(() => {
          if (cancelled) return
          photoRef.current = null
          paint()
        })
      return () => {
        cancelled = true
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.photoUrl])

    useEffect(() => {
      // Committed state changes (name / transform after gesture end)
      paint()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.name, state.photoTransform])

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
  },
)

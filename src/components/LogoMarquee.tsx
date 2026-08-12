import { useEffect, useRef } from 'react'
import type { PointerEvent } from 'react'
import { imageUrl } from '../lib/img'
import { wrapScroll } from '../lib/marquee'
import type { ClientLogo } from '../lib/sanity'

/** Slow enough to read a logo, fast enough to look alive. */
const SPEED_PX_PER_FRAME = 0.4

/**
 * Infinite, drag-scrollable client logo strip.
 *
 * Built on a native `overflow-x` container rather than a transform animation,
 * because that gives touch drag, keyboard arrow scrolling and momentum for
 * free, and leaves only the auto-advance and the mouse drag to write.
 */
export function LogoMarquee({ logos }: { logos: ClientLogo[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const isPaused = useRef(false)
  const isDragging = useRef(false)
  const dragOrigin = useRef({ pointerX: 0, scrollLeft: 0 })

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = requestAnimationFrame(function step() {
      if (!isPaused.current) {
        track.scrollLeft = wrapScroll(track.scrollLeft + SPEED_PX_PER_FRAME, track.scrollWidth / 2)
      }
      frame = requestAnimationFrame(step)
    })

    return () => cancelAnimationFrame(frame)
  }, [])

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    const track = trackRef.current
    if (!track) return
    isDragging.current = true
    isPaused.current = true
    dragOrigin.current = { pointerX: event.clientX, scrollLeft: track.scrollLeft }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const track = trackRef.current
    if (!track || !isDragging.current) return
    const travelled = event.clientX - dragOrigin.current.pointerX
    track.scrollLeft = wrapScroll(dragOrigin.current.scrollLeft - travelled, track.scrollWidth / 2)
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    isDragging.current = false
    isPaused.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  if (logos.length === 0) return null

  return (
    <div
      ref={trackRef}
      className="marquee"
      role="group"
      aria-label="Selected clients"
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => (isPaused.current = true)}
      onMouseLeave={() => {
        if (!isDragging.current) isPaused.current = false
      }}
    >
      {/* Rendered twice so the halfway wrap is seamless. The second copy is
          decorative, so it stays out of the accessibility tree. */}
      {[0, 1].map((copy) =>
        logos.map((logo, index) => (
          <div
            key={`${copy}-${index}`}
            className="marquee-item"
            aria-hidden={copy === 1 ? true : undefined}
          >
            {logo.image ? (
              <img src={imageUrl(logo.image, 240)} alt={logo.name} draggable={false} />
            ) : (
              logo.name
            )}
          </div>
        )),
      )}
    </div>
  )
}

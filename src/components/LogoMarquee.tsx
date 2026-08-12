import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { imageUrl } from '../lib/img'
import { wrapScroll } from '../lib/marquee'
import type { ClientLogo } from '../lib/sanity'

/** Slow enough to read a logo, fast enough to look alive. */
const SPEED_PX_PER_SECOND = 26

/** Copies of the list needed to fill the track and still have room to wrap. */
const MIN_COPIES = 2

/**
 * Infinite, drag-scrollable client logo strip.
 *
 * Built on a native `overflow-x` container rather than a transform animation,
 * because that gives touch drag, keyboard arrow scrolling and momentum for
 * free, and leaves only the auto-advance and the mouse drag to write.
 *
 * The list is repeated until the track is comfortably wider than the viewport.
 * Two copies is enough once there are a dozen logos, but a new client list with
 * three would produce a track narrower than the screen, where there is nothing
 * to scroll and the strip sits still. The count is measured rather than assumed
 * so the section works from the first logo to the hundredth.
 */
export function LogoMarquee({ logos }: { logos: ClientLogo[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const isPaused = useRef(false)
  const isDragging = useRef(false)
  const dragOrigin = useRef({ pointerX: 0, scrollLeft: 0 })
  /**
   * The scroll position as a float.
   *
   * `scrollLeft` rounds an assignment to a whole number, so writing `current +
   * 0.4` every frame reads back unchanged and the strip never moves. The
   * fraction is accumulated here and only whole pixels reach the element, which
   * is what makes a slow drift possible at all.
   */
  const offsetRef = useRef(0)
  const [copies, setCopies] = useState(MIN_COPIES)

  // Measure one copy against the viewport and repeat until the track is at
  // least twice the visible width, so half of it is always off screen.
  useEffect(() => {
    const track = trackRef.current
    if (!track || logos.length === 0) return

    function fit() {
      const element = trackRef.current
      if (!element) return
      const oneCopy = element.scrollWidth / copies
      if (oneCopy === 0) return

      const wanted = Math.max(MIN_COPIES, Math.ceil((element.clientWidth * 2) / oneCopy))
      if (wanted !== copies) setCopies(wanted)
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(track)
    return () => observer.disconnect()
  }, [logos, copies])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    offsetRef.current = track.scrollLeft
    let last = performance.now()

    let frame = requestAnimationFrame(function step(now) {
      // Advance by elapsed time rather than per frame, so the speed is the same
      // on a 60Hz and a 120Hz screen.
      const elapsed = Math.min(now - last, 100)
      last = now

      const span = track.scrollWidth / copies
      if (!isPaused.current && span > 0) {
        offsetRef.current = wrapScroll(offsetRef.current + (SPEED_PX_PER_SECOND * elapsed) / 1000, span)
        track.scrollLeft = Math.round(offsetRef.current)
      }
      frame = requestAnimationFrame(step)
    })

    return () => cancelAnimationFrame(frame)
  }, [copies])

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
    const next = wrapScroll(dragOrigin.current.scrollLeft - travelled, track.scrollWidth / copies)
    // Keep the float in step with the drag, or the auto-advance resumes from
    // wherever it left off and the strip jumps backwards under the finger.
    offsetRef.current = next
    track.scrollLeft = next
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
      {/* Every copy after the first is decorative, so it stays out of the
          accessibility tree and a screen reader hears the client list once. */}
      {Array.from({ length: copies }, (_, copy) =>
        logos.map((logo, index) => (
          <div
            key={`${copy}-${index}`}
            className="marquee-item"
            aria-hidden={copy > 0 ? true : undefined}
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

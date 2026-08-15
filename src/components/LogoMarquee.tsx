import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { imageUrl } from '../lib/img'
import { wrapOffset } from '../lib/marquee'
import type { ClientLogo } from '../lib/sanity'

/** Fast enough to read as motion, slow enough to read a logo. */
const SPEED_PX_PER_SECOND = 70

/** Copies of the list needed to fill the track and still have room to wrap. */
const MIN_COPIES = 2

/**
 * Infinite, drag-scrollable client logo strip.
 *
 * Driven by `transform` on an inner track rather than by the container's
 * `scrollLeft`. `scrollLeft` snaps to whole pixels, so a slow drift advances
 * nothing for two frames and then jumps a pixel, which reads as a stutter no
 * matter how the timing is written. A transform takes sub-pixel values and is
 * composited, so the same speed is smooth and costs no layout per frame.
 *
 * The list is repeated until the track is comfortably wider than the viewport.
 * Two copies is enough once there are a dozen logos, but a client list with
 * three would produce a track narrower than the screen, where a lap is shorter
 * than the visible area and the wrap is visible. The count is measured rather
 * than assumed, so the section works from the first logo to the hundredth.
 */
export function LogoMarquee({ logos }: { logos: ClientLogo[] }) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const isPaused = useRef(false)
  const isDragging = useRef(false)
  const dragOrigin = useRef({ pointerX: 0, offset: 0 })
  /** Distance travelled, as a float. Whole pixels never reach the element. */
  const offsetRef = useRef(0)
  const [copies, setCopies] = useState(MIN_COPIES)

  // Measure one copy against the viewport and repeat until the track is at
  // least twice the visible width, so a lap is always longer than the screen.
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || logos.length === 0) return

    function fit() {
      const track = trackRef.current
      const element = viewportRef.current
      if (!track || !element) return

      const oneCopy = track.scrollWidth / copies
      if (oneCopy === 0) return

      const wanted = Math.max(MIN_COPIES, Math.ceil((element.clientWidth * 2) / oneCopy))
      if (wanted !== copies) setCopies(wanted)
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [logos, copies])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let last = performance.now()

    let frame = requestAnimationFrame(function step(now) {
      // Advance by elapsed time rather than per frame, so the speed matches on a
      // 60Hz and a 120Hz screen. The clamp stops a backgrounded tab returning
      // with a multi-second jump.
      const elapsed = Math.min(now - last, 100)
      last = now

      const span = track.scrollWidth / copies
      if (!isPaused.current && span > 0) {
        offsetRef.current = wrapOffset(offsetRef.current + (SPEED_PX_PER_SECOND * elapsed) / 1000, span)
        track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`
      }
      frame = requestAnimationFrame(step)
    })

    return () => cancelAnimationFrame(frame)
  }, [copies])

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    isDragging.current = true
    isPaused.current = true
    dragOrigin.current = { pointerX: event.clientX, offset: offsetRef.current }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const track = trackRef.current
    if (!track || !isDragging.current) return
    const travelled = event.clientX - dragOrigin.current.pointerX
    offsetRef.current = wrapOffset(dragOrigin.current.offset - travelled, track.scrollWidth / copies)
    track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`
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
      ref={viewportRef}
      className="marquee"
      role="group"
      aria-label="Selected clients"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => (isPaused.current = true)}
      onMouseLeave={() => {
        if (!isDragging.current) isPaused.current = false
      }}
    >
      <div ref={trackRef} className="marquee-track">
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
    </div>
  )
}

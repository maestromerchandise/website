import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import type { AnimationPlaybackControls } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
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
 * The offset is a motion value written straight to `transform`, so the drift
 * never rounds to whole pixels the way `scrollLeft` does, and it never
 * re-renders React. Releasing a drag hands the pointer's velocity to an inertia
 * animation, so the strip carries the throw and then eases back into the drift
 * rather than stopping dead under the finger.
 *
 * One animation owns the offset at a time, tracked in `controls`. A drag stops
 * whatever is running before taking over, because a drift left running would
 * keep writing the offset and fight the finger.
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
  const offset = useMotionValue(0)
  const controls = useRef<AnimationPlaybackControls>(null)
  const isDragging = useRef(false)
  const dragOrigin = useRef({ pointerX: 0, offset: 0 })
  const prefersReducedMotion = useReducedMotion()
  const [copies, setCopies] = useState(MIN_COPIES)

  /** The offset counts up as the strip travels; the track moves the other way. */
  const x = useTransform(offset, (value) => -value)

  /** One lap: the width of a single copy of the list. */
  const lap = useCallback(() => (trackRef.current?.scrollWidth ?? 0) / copies, [copies])

  const startDrift = useCallback(() => {
    controls.current?.stop()
    if (prefersReducedMotion) return

    const span = lap()
    if (span <= 0) return

    // Restart from a wrapped position each time, so the value never grows
    // without bound across a long session.
    const from = wrapOffset(offset.get(), span)
    offset.set(from)
    controls.current = animate(offset, from + span, {
      duration: span / SPEED_PX_PER_SECOND,
      ease: 'linear',
      repeat: Infinity,
      repeatType: 'loop',
    })
  }, [lap, offset, prefersReducedMotion])

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
    startDrift()
    return () => controls.current?.stop()
  }, [startDrift])

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    controls.current?.stop()
    isDragging.current = true
    dragOrigin.current = { pointerX: event.clientX, offset: offset.get() }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!isDragging.current) return
    const travelled = event.clientX - dragOrigin.current.pointerX
    offset.set(wrapOffset(dragOrigin.current.offset - travelled, lap()))
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!isDragging.current) return
    isDragging.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    // Carry the throw, then hand the strip back to the drift.
    controls.current = animate(offset, offset.get(), {
      type: 'inertia',
      velocity: offset.getVelocity(),
      power: 0.3,
      timeConstant: 200,
      onComplete: startDrift,
    })
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
    >
      <motion.div ref={trackRef} className="marquee-track" style={{ x }}>
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
                // Sized from the logo's own proportions, so the track is laid out
                // at its final width before any logo has downloaded, and the logos
                // do not slide sideways one by one as they arrive.
                <img
                  src={imageUrl(logo.image, 240)}
                  alt={logo.name}
                  width={logo.aspectRatio ? Math.round(72 * logo.aspectRatio) : undefined}
                  height={logo.aspectRatio ? 72 : undefined}
                  draggable={false}
                />
              ) : (
                logo.name
              )}
            </div>
          )),
        )}
      </motion.div>
    </div>
  )
}

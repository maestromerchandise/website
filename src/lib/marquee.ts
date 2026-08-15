/**
 * Wrap a marquee offset into `[0, span)`.
 *
 * The track repeats its list until it is wider than the viewport, and one copy
 * is a lap. Both the auto-advance and a backwards drag have to land inside that
 * lap, or the strip jumps to an empty stretch. A plain `%` returns a negative
 * result for a negative offset, hence the add-then-modulo.
 */
export function wrapOffset(offset: number, span: number): number {
  if (span <= 0) return 0
  return ((offset % span) + span) % span
}

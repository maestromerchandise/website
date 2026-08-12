/**
 * Wrap a scroll offset into `[0, span)`.
 *
 * The marquee renders its list twice and treats half the track as one lap, so
 * both the auto-scroll and a backwards drag need to land inside that lap. A
 * plain `%` returns a negative result for a negative offset, which would jump
 * the track off the left edge, hence the add-then-modulo.
 */
export function wrapScroll(offset: number, span: number): number {
  if (span <= 0) return 0
  return ((offset % span) + span) % span
}

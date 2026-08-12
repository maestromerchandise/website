import type { ReactNode } from 'react'

type Props = {
  id?: string
  heading: string
  /** Sits under the heading, for the Custom Gift and Custom Box invitations. */
  intro?: string
  /** Full-bleed sections (the marquee, the category strip) opt out of the shell. */
  bleed?: boolean
  children: ReactNode
}

/**
 * One section of the home page.
 *
 * Every section in the reference is the same shape, a centred uppercase label
 * over its content with generous space around it, so it is written once here
 * rather than repeated per section.
 */
export function Section({ id, heading, intro, bleed = false, children }: Props) {
  return (
    <section id={id} className="section">
      <div className="shell section-heading">
        <h2 className="eyebrow">{heading}</h2>
        {intro && <p className="section-intro">{intro}</p>}
      </div>
      {bleed ? children : <div className="shell">{children}</div>}
    </section>
  )
}

/**
 * Measures.ts
 *
 * The one `rem` helper, and every size in the app that is not board geometry.
 *
 * ── The rule ─────────────────────────────────────────────────────────────────
 * Three units, and which one to reach for is decided by what the box holds:
 *
 *   rem     Anything sized around text. Dialogs, panels, inputs, controls,
 *           icons, and any strip whose height exists to hold an icon or a line
 *           of text. rem is measured against the root font size, so a reader who
 *           sets their browser default to 24px gets a box that grew with the
 *           words in it.
 *
 *   theme   Gaps and padding, via sx's `gap: 2` / `p: 1` (1 = 8px). These are
 *   units   space *between* things rather than room *for* something, so they are
 *           deliberately left on a px-based scale — see the note at the bottom.
 *
 *   px      Hairlines and chrome: a 1px border, a 2px focus ring, a 5px gutter.
 *           A border that grows with the font is a thicker border, not a more
 *           readable one.
 *
 * ── Why this mattered ────────────────────────────────────────────────────────
 * Measured on the board before the conversion: at a 24px browser default the
 * card title went 11.2px → 16.8px inside a column that stayed exactly 300px.
 * Nothing overflowed, because the titles are line-clamped — the text was simply
 * cut sooner. The accessibility setting removed content instead of helping.
 *
 * The same held everywhere else. `width: 480` on the overlay, `width: 560` on
 * the task popover, `maxHeight: 200` on the selector list: every one of them a
 * fixed box around text that grows.
 *
 * ── Why the values are written as rem(480) ───────────────────────────────────
 * The design values were chosen in px, and that is how the Blazor original
 * expressed them. Converting once here keeps the intent legible — `rem(480)`
 * says where the number came from in a way `30rem` does not.
 *
 * 16 is the CSS initial root font size. It is not an assumption about the
 * reader: it is the divisor that makes rem(480) equal 480px for someone who has
 * changed nothing, and scale from there for everyone who has.
 */

export const rem = (px: number) => `${px / 16}rem`

// ── Dialogs and popovers ──────────────────────────────────────────────────────

/** ArcOverlay's default width. Every create/edit overlay is this wide. */
export const OVERLAY_WIDTH = rem(480)

/** ArcPopover's floor. Narrower than this and the button group wraps. */
export const POPOVER_MIN_WIDTH = rem(280)

/** The task popover, which holds a timeline panel beside the task fields. */
export const TASK_POPOVER_WIDTH = rem(560)

/**
 * A timeline mode panel's ceiling.
 *
 * All three panels were a flat `width: 460` inside a 560px popover that also had
 * to hold the task fields, so the panel hung 109px outside the dialog. Stated as
 * a maximum with `width: 100%` and `minWidth: 0`, a panel takes the width it is
 * given and the pickers inside it wrap.
 */
export const TIMELINE_PANEL_MAX_WIDTH = rem(460)

// ── Controls ──────────────────────────────────────────────────────────────────

/** ArcExpandingSelector's collapsed bar — one line of text plus its padding. */
export const SELECTOR_SUMMARY_MIN_HEIGHT = rem(40)

/** How far the selector's option list opens before it scrolls. */
export const SELECTOR_LIST_MAX_HEIGHT = rem(200)

/**
 * The card overlay's task list.
 *
 * Stays a fixed height, unlike most of this file, because the list scrolls its
 * own contents — the height is what the scrollport is, not a box that text is
 * being squeezed into. Only the unit changes, so the scrollport grows with the
 * rows inside it instead of showing fewer of them.
 */
export const TASK_LIST_HEIGHT = rem(200)

/**
 * The card overlay's title row, which holds an input beside the tags chip.
 *
 * A minimum, where it was a fixed `height: 75`. This is the case the rem pass
 * exists for: the row holds a TextField *and* its helper text, both of which
 * grow with the root font size, and a fixed 75px cut the helper text off at a
 * large default. A floor lets the row grow to hold what is in it.
 */
export const TITLE_ROW_MIN_HEIGHT = rem(75)

/** The tags placeholder. Fixed because its content is fixed — one short word. */
export const TAG_CHIP_WIDTH = rem(120)
export const TAG_CHIP_HEIGHT = rem(60)

/** CommandPanel: the stub chat input beside the card's timeline. */
export const COMMAND_PANEL_MIN_WIDTH = rem(240)
export const COMMAND_LOG_MIN_HEIGHT = rem(80)

// ── Card chrome ───────────────────────────────────────────────────────────────

/**
 * The grab strip along the top of a card.
 *
 * rem and not px despite being chrome, because what it holds is an icon — and
 * an MUI icon is sized in font units. At a 24px root the icon grew to 21px
 * inside a 16px strip and pushed the card's content down. The strip has to grow
 * with the thing it exists to contain.
 */
export const DRAG_HANDLE_HEIGHT = rem(16)
export const DRAG_HANDLE_ICON_SIZE = rem(14)

/** The Actions / Remove row at the foot of a card. */
export const CARD_ACTIONS_MAX_HEIGHT = rem(50)

/*
 * ── A note on gaps ───────────────────────────────────────────────────────────
 * MUI's spacing scale is px-based: `gap: 2` is 16px at any root font size, and
 * every `p:` / `gap:` / `mb:` in this app goes through it.
 *
 * That is deliberate. A gap is the one measurement here that is not holding
 * text, and on a dense board the extra room from a larger font is better spent
 * on the words than on the space between them.
 *
 * If that turns out to be the wrong call, it is one line in Theme.tsx:
 *
 *     createTheme({ spacing: (factor: number) => rem(factor * 8) })
 *
 * which is identical at a 16px root — `gap: 2` stays 16px — and scales with the
 * reader from there. Nothing else in the app would need to change.
 */

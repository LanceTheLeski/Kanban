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


// ── Controls ──────────────────────────────────────────────────────────────────

/** ArcExpandingSelector's collapsed bar — one line of text plus its padding. */
export const SELECTOR_SUMMARY_MIN_HEIGHT = rem(40)

/** How far the selector's option list opens before it scrolls. */
export const SELECTOR_LIST_MAX_HEIGHT = rem(200)

/**
 * The card overlay's task list.
 *
 * A floor, not a height. It used to be a fixed 200px, which made it the only
 * thing in the left column with an opinion — so the column ended 70px short of
 * the description beside it and the overlay looked, correctly, unbalanced. The
 * list now takes whatever height the row has left and scrolls inside it.
 */
export const TASK_LIST_MIN_HEIGHT = rem(120)

/**
 * The tags box beside the card title.
 *
 * A basis rather than a fixed width — it shrinks before the title does when the
 * overlay is narrow, and never takes more than its share when it is wide.
 */
export const TAGS_BOX_WIDTH = rem(176)

/**
 * The row holding the title and the tags.
 *
 * A minimum, where it was a fixed `height: 75`. The row holds a TextField *and*
 * its helper text, both of which grow with the root font size, and a fixed 75px
 * cut the helper text off at a large default.
 */
export const TITLE_ROW_MIN_HEIGHT = rem(84)

/**
 * The card overlay's two rows.
 *
 * Floors, so neither collapses when its content is sparse — an empty card should
 * not produce a different shape of dialog from a full one.
 */
export const CARD_DETAIL_ROW_MIN_HEIGHT = rem(300)
export const CARD_PANEL_ROW_MIN_HEIGHT = rem(170)

/**
 * And a ceiling on that row.
 *
 * Without one the card log sets the row's height from its own entry count, so a
 * card with a long history produced a taller dialog than a card with a short
 * one — and the timeline panel beside it stretched to match, turning two lines
 * of "no deadline set" into a 400px block of colour. A log should scroll, not
 * grow the window it is in.
 */
export const CARD_PANEL_ROW_MAX_HEIGHT = rem(210)

/** CommandPanel: the stub chat input beside the card's timeline. */
export const COMMAND_PANEL_MIN_WIDTH = rem(240)
export const COMMAND_LOG_MIN_HEIGHT = rem(80)

// ── Card chrome ───────────────────────────────────────────────────────────────

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

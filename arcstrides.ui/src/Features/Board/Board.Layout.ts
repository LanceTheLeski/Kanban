/**
 * Board.Layout.ts
 *
 * The board's geometry, in one place.
 *
 * ── Why these are not just numbers in the JSX ────────────────────────────────
 * The column header row and the swimlane rows are separate elements that have to
 * line up pixel for pixel. While each carried its own literal `width: 300`, the
 * only thing keeping them aligned was that nobody had edited one without the
 * other. Both now read the same token, so they cannot drift.
 *
 * ── Why a Kanban board scrolls rather than shrinks ───────────────────────────
 * The card overlay divides a fixed space between two panes, so there it makes
 * sense to express the columns as a ratio (see UpdateCardOverlay). A board is the
 * opposite: the number of columns is the user's choice, not the layout's, and
 * dividing the viewport by it would make eight columns unusable at any width.
 *
 * So a column has a *width per breakpoint* and the board scrolls sideways — the
 * same thing Trello and Jira do. Being responsive here means the column gets
 * narrower on a small screen, not that more of them are squeezed on.
 *
 * ── Heights grow ─────────────────────────────────────────────────────────────
 * Everything vertical is a minimum, never a fixed height. The Blazor original
 * pinned cells at 200px inside a 250px box, so a fourth card in one cell was
 * simply cut off. Cells now start at a minimum and grow with what is in them, and
 * a row is as tall as its tallest cell.
 */

/*
 * ── Using these in `sx` ──────────────────────────────────────────────────────
 * Every token below is already a breakpoint map, so pass it to `sx` directly:
 *
 *     width: COLUMN_WIDTH                         ✅
 *
 * To combine one with a value of your own, spread it — never nest it:
 *
 *     width: { ...SWIMLANE_LABEL_WIDTH, xs: '100%' }     ✅
 *     width: { xs: '100%', sm: SWIMLANE_LABEL_WIDTH }    ❌
 *
 * The second hands MUI a map where it expects a CSS value. It cannot resolve
 * that, so it drops the entry *without warning* and the remaining `xs` cascades
 * to every breakpoint. That failure is invisible in a type check and in any
 * measurement that only asks "does the page overflow?" — it cost a debugging
 * round already.
 */

/*
 * ── Why rem and not px ───────────────────────────────────────────────────────
 * A browser's "default font size" setting changes the root font size, and rem is
 * measured against it. px is not. With px widths, a reader who sets 24px gets
 * text 50% larger inside a column that has not moved at all — measured on this
 * board: the card title went 11.2px → 16.8px while the column stayed exactly
 * 300px. Nothing overflows, because the titles are line-clamped; the text is
 * simply cut sooner, so the setting that was meant to help quietly removes
 * content instead.
 *
 * Every box here holds text, so every box is stated in rem and grows with it.
 * Fewer columns fit on screen at 24px — which is the honest trade, and the board
 * already scrolls sideways.
 *
 * Breakpoints stay in px (MUI's are px by design) because they describe the
 * device, not the text.
 */

/**
 * The design values are kept in px because that is how they were chosen — and
 * how the Blazor original expressed them — then converted once, here. Writing
 * `rem(300)` keeps the intent legible where `18.75rem` would not.
 *
 * 16 is the CSS initial root size, not an assumption about the reader: it is the
 * divisor that makes rem(300) equal 300px for someone who has changed nothing,
 * and scale from there for everyone else.
 */
const rem = (px: number) => `${px / 16}rem`

/**
 * Column width. Everything on the board is measured against this: the header
 * above a column, the drop cell below it, and the card inside that.
 */
export const COLUMN_WIDTH = { xs: rem(232), sm: rem(264), md: rem(300) }

/** The swimlane's name, down the left of every row. */
export const SWIMLANE_LABEL_WIDTH = { xs: rem(76), sm: rem(92), md: rem(110) }

/** The board title block, which sits above the swimlane labels. */
export const BOARD_TITLE_WIDTH = SWIMLANE_LABEL_WIDTH

/** A drop cell is at least this tall even when empty, so it stays a target. */
export const CELL_MIN_HEIGHT = { xs: rem(148), md: rem(184) }

/**
 * A card fills the width of its cell rather than sitting at a fixed 120px inside
 * a 300px column. Cards are mostly text, and the old fixed width was truncating
 * titles after roughly four words while three quarters of the column sat empty.
 */
export const CARD_MIN_HEIGHT = rem(116)

/** The ghost card that follows the cursor mid-drag, outside any cell. */
export const DRAG_PREVIEW_WIDTH = rem(232)

/**
 * Spacing between cells and cards, in theme units (1 = 8px).
 *
 * Left in theme units deliberately: MUI's spacing scale is px-based, and a gap
 * is the one measurement here that is not holding text. Gaps that do not grow
 * with the font are the right behaviour — the text gets the extra room instead.
 */
export const BOARD_GAP = 1

/**
 * Below this the board is too narrow for a swimlane label beside the cells, so
 * the label moves above its row.
 */
export const STACK_LABEL_BELOW = 'sm'

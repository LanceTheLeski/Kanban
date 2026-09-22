/**
 * Board.Notes
 *
 * Which colour of note a card is written on.
 *
 * ── Why the swimlane and not the card ────────────────────────────────────────
 * A wall of notes in one colour is a wall of one pad, which is honest and also
 * what the board looked like before: every card `lightyellow` on a yellow cell.
 * Giving each *card* its own colour would look better and mean nothing, and a
 * colour that looks like it means something is read as though it does.
 *
 * The swimlane is a real grouping that already has an identity — its label
 * carries a colour, and a card belongs to exactly one. So the note colour says
 * which lane a card is in, which is a fact, and dragging a card to another lane
 * recolours it, which is the feedback a move should give.
 *
 * ── Why the order and not the id ─────────────────────────────────────────────
 * Keying off the id would be stable but arbitrary: two adjacent lanes could
 * land on near-identical colours. The order is what the board is arranged by,
 * so stepping through the stocks in order guarantees neighbouring lanes differ,
 * and only repeats past the sixth lane.
 */

/** The stocks, in the order lanes take them. */
export const NOTE_STOCKS = ['canary', 'rose', 'sky', 'mint', 'apricot'] as const

export type NoteStock = (typeof NOTE_STOCKS)[number]

/**
 * The class pair for a card in the given swimlane.
 *
 * Takes the swimlane's order rather than a `Swimlane`, because BoardCard has
 * the denormalised `swimlaneNumber` on the card itself and threading the lane
 * down through the cell and the draggable would be four props for one number.
 */
export function noteClass(swimlaneOrder: number): string {
    // A negative or absent order still has to land on a stock rather than on
    // `undefined`, which would leave the note with no colour at all.
    const index = ((Math.trunc(swimlaneOrder) % NOTE_STOCKS.length) + NOTE_STOCKS.length) % NOTE_STOCKS.length
    return `note note-${NOTE_STOCKS[index]}`
}

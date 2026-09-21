/**
 * CardCommand.Types
 *
 * What goes in a card's command console.
 *
 * ── Commands, not logs ───────────────────────────────────────────────────────
 * This started as a card *log*: a history of everything that had happened to
 * the card, with the command line as a way to add to it. There is no history to
 * show — the server records none — so the panel was inventing a plausible one
 * and labelling it "sample data".
 *
 * Commands are the half that was always real. What the panel shows now is the
 * transcript of what you have run in this session: what you typed, and what
 * came back. Nothing is stored, and nothing pretends to be.
 *
 * That also makes the entry kinds smaller. A log needs to distinguish a system
 * event from a person's note; a transcript only needs to say which lines you
 * wrote and which the console answered.
 */

/**
 * The kinds, in the order they occur:
 *
 *   command  a line you typed
 *   result   what it did
 *   error    why it did not
 */
export type CardCommandKind = 'command' | 'result' | 'error'

/**
 * A run of content inside one entry.
 *
 * `entity` is anything that names something on the board — a column, a
 * swimlane, a task. It renders as a pill, and is the hook for making these
 * clickable once there is somewhere to click through to.
 */
export type CardCommandSpan =
    | { text: string }
    | { entity: string; kind?: 'column' | 'swimlane' | 'task' | 'tag' }

export interface CardCommandEntry {
    id: string
    kind: CardCommandKind
    at: Date
    content: CardCommandSpan[]
}

/** Shorthand for the common case of a run of plain words. */
export const text = (value: string): CardCommandSpan => ({ text: value })

export const entity = (value: string,
                       kind?: Exclude<CardCommandSpan, { text: string }>['kind']): CardCommandSpan =>
    ({ entity: value, kind })

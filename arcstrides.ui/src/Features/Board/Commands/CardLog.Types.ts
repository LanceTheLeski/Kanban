/**
 * CardLog.Types
 *
 * What goes in a card's history panel.
 *
 * ── The shape this is aiming at ──────────────────────────────────────────────
 * A cross between a chat window and a game's event log: mostly system messages
 * narrating what has happened to the card, with the occasional line a person
 * wrote, and commands typed into the same stream. The thing that makes such a
 * log readable at a glance is that every entry is the same shape — a time, a
 * kind, and one line of content — so the eye can run down the left edge and
 * sort them without reading.
 *
 * ── Why the content is structured, not a string ──────────────────────────────
 * "Moved to In Progress" as a formatted string cannot be styled, searched, or
 * translated, and the entity names in it cannot be made clickable later. An
 * entry instead carries its pieces — plain text and named entities — so the
 * renderer decides how a column name looks and this file does not.
 *
 * ── Status ───────────────────────────────────────────────────────────────────
 * The log has no server behind it yet. See CommandPanel for what that means and
 * what the API would have to provide.
 */

/**
 * The kinds, in the order they matter when scanning:
 *
 *   event    the system recorded something — moved, renamed, task completed
 *   note     a person wrote something
 *   command  a person typed a command
 *   result   what a command answered
 *   alert    something wants attention — a deadline passed, a write rejected
 */
export type CardLogKind = 'event' | 'note' | 'command' | 'result' | 'alert'

/**
 * A run of content inside one entry.
 *
 * `entity` is anything that names something on the board — a column, a
 * swimlane, a task, a person. It is rendered as a pill, and is the hook for
 * making these clickable once there is somewhere to click through to.
 */
export type CardLogSpan =
    | { text: string }
    | { entity: string; kind?: 'column' | 'swimlane' | 'task' | 'person' | 'tag' }

export interface CardLogEntry {
    id: string
    kind: CardLogKind
    at: Date
    /** Who did it. Absent for something the system did on its own. */
    actor?: string
    content: CardLogSpan[]
}

/** Shorthand for the common case of a run of plain words. */
export const text = (value: string): CardLogSpan => ({ text: value })
export const entity = (value: string, kind?: Exclude<CardLogSpan, { text: string }>['kind']): CardLogSpan =>
    ({ entity: value, kind })

/**
 * Calendar.Views.ts
 *
 * The views a day's arrows step through: which cards it shows, and which of
 * their tasks.
 *
 * Mirrors: the carousel in CalendarDate.razor. Its pages were one per board —
 * `Date.Cards.Select (card => card.BoardID).Distinct ()` — each holding that
 * board's cards and their tasks, and the left and right arrows moved between
 * them. (They were meant to: moveLeft and moveRight assigned to a copy of the
 * index, so the pages only ever changed by auto-cycling. These move.)
 *
 * ── The views, in order ──────────────────────────────────────────────────────
 * Written as data, so a view is a line in the list below rather than a new
 * branch somewhere, and the set can be reshaped without touching the day.
 *
 *   All          every card on the day — put on it, or due on it — with its
 *                tasks: all of them for a card put on the day, the ones due
 *                that day for a card that is only due (Calendar.Stops,
 *                cardsOnDay)
 *   Open         only tasks not yet done — the day's remaining work
 *   one per type every card's tasks of that type — the ring's segments, one at
 *                a time
 *   one per board each board's cards, as the Blazor carousel paged them. Only
 *                when the day has cards from more than one board: with one, it
 *                would be All again under another name.
 *
 * A view that would show nothing is left out, so the arrows never land on an
 * empty page. All is always first, and is where the label takes you back to.
 */

import type { Card } from '../../Entities/Card/Card.Types'
import type { Task } from '../../Entities/Task/Task.Types'
import type { DayCardEntry } from './Calendar.Stops'

/** A card as a view shows it: the card on the day, and the tasks of it this view keeps. */
export interface ViewCard
{
    /** Why the card is on the day, and what of it falls on the day. */
    entry: DayCardEntry

    card: Card

    tasks: Task[]
}

export interface DayView
{
    key: string

    /** The whole name, for tooltips and screen readers. */
    label: string

    /**
     * The heading on the day itself: capitals, at most HEADING_LENGTH of them —
     * "ALL", "OPEN", "FEAT". Written out per view rather than cut from `label`
     * where cutting would mislead: "No type" is NONE, not NOTY. Meant to become
     * something a user sets; until then these are the defaults.
     */
    short: string

    cards: ViewCard[]
}

/** The most characters a view's heading takes on a day. */
export const HEADING_LENGTH = 4

/** A heading from a name: capitals, no spaces, cut to HEADING_LENGTH. */
export function headingOf(text: string): string
{
    return text.replace(/[^\p{L}\p{N}]/gu, '').toUpperCase().slice(0, HEADING_LENGTH) || '—'
}

/**
 * Every view of a day's cards that has something in it.
 *
 * `boardTitle` names a board for its view; the calendar only knows a board's ID
 * until it has read the board, so the name may arrive after the view does.
 */
export function viewsFor(entries: DayCardEntry[], boardTitle: (boardId: string) => string | null): DayView[]
{
    if (entries.length === 0)
        return []

    const all: DayView = { key: 'all', label: 'All', short: 'ALL', cards: entries.map(entry => ({ entry, card: entry.card, tasks: entry.tasks })) }

    const open = byTasks('open', 'Open', 'OPEN', entries, task => !task.isCompleted)

    const types = uniqueBy(entries.flatMap(entry => entry.tasks), task => task.taskType?.id ?? null)
        .map(task => task.taskType)
        .sort((a, b) => (a?.id ?? Infinity) - (b?.id ?? Infinity))
        .map(type => byTasks(`type:${type?.id ?? 'none'}`,
                             type?.title || 'No type',
                             type
                                 ? headingOf(type.title)
                                 : 'NONE',
                             entries,
                             task => (task.taskType?.id ?? null) === (type?.id ?? null)))

    const cards = entries.map(entry => entry.card)
    const boardIds = uniqueBy(cards, card => card.boardId).map(card => card.boardId)
    const boards = boardIds.length < 2
        ? []
        : boardIds.map(boardId =>
          ({
              key: `board:${boardId}`,
              label: boardTitle(boardId) || boardLabel(boardId),
              short: boardTitle(boardId)
                  ? headingOf(boardTitle(boardId)!)
                  : boardId.slice(0, HEADING_LENGTH).toUpperCase(),
              cards: entries.filter(entry => entry.card.boardId === boardId).map(entry => ({ entry, card: entry.card, tasks: entry.tasks })),
          }))

    // Open is only worth a page when it differs from All: some task is done.
    const openDiffers = open.cards.length > 0 && entries.some(entry => entry.tasks.some(task => task.isCompleted))
    // Types are only worth pages when there is more than one of them.
    const typeViews = types.length > 1
        ? types
        : []

    return [all, ...(openDiffers
        ? [open]
        : []), ...typeViews, ...boards]
        .filter(view => view.cards.length > 0)
}

/**
 * What to call a board that has no name — which, until the API stores board
 * names, is every board. The first characters of its ID: not friendly, but the
 * same on every day and every page, which a position ("Board 2") would not be.
 */
export function boardLabel(boardId: string): string
{
    return `Board ${boardId.slice(0, 4).toUpperCase()}`
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** Cards that have at least one shown task passing `keep`, showing only those tasks. */
function byTasks(key: string, label: string, short: string, entries: DayCardEntry[], keep: (task: Task) => boolean): DayView
{
    return {
        key,
        label,
        short,
        cards: entries
            .map(entry => ({ entry, card: entry.card, tasks: entry.tasks.filter(keep) }))
            .filter(viewCard => viewCard.tasks.length > 0),
    }
}

function uniqueBy<T, K>(items: T[], keyOf: (item: T) => K): T[]
{
    const seen = new Set<K>()
    return items.filter(item =>
    {
        const key = keyOf(item)
        if (seen.has(key))
            return false
        seen.add(key)
        return true
    })
}

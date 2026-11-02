/**
 * Tag entity.
 *
 * Shared rather than board-owned: a tag goes on a card, a task or a calendar
 * day, and one tag can be on all three — "Blocked" on a card and on one of its
 * tasks is the same tag, with the same ID.
 *
 * On the server a tag is one ID with a row for each thing it is on (see
 * Models/Tag/Tag.cs). Here it is only what a thing needs to show it: its ID, its
 * title and its colour. Which thing it is on is known from where it was found.
 */

export interface Tag
{
    id: string

    title: string

    /** `#rrggbb`, chosen from the board's Tags menu; null for the default red. See Tag.Colours. */
    colour: string | null
}

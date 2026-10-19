/**
 * Tag.APIs
 *
 * Putting tags on things and taking them off: cards, tasks and calendar days.
 *
 * ── Read with their parents ──────────────────────────────────────────────────
 * A card's and a task's tags arrive with them on the board (BoardController), and
 * a day's with the month (CalendarController), so nothing here reads one thing's
 * tags. What is read here is the list of every tag there is, for suggesting one
 * as it is typed — so "blocked" on a task is the "Blocked" already on its card,
 * not a second tag.
 *
 * ── Saved with the thing ─────────────────────────────────────────────────────
 * The card editor, the task popover and the day overlay hold their tags as a
 * draft, like every other field in them, and the difference is written when
 * they are saved — by saveTags here, and by the calendar store for a day.
 */

import { apiClient, ARC } from '../../../Lib/Client'
import type { Tag } from '../../../Entities/Tag/Tag.Types'

/** What a tag's parent is, as the API numbers it (TagParentTypes.cs). */
export const TAG_PARENT =
{
    column: 0,
    swimlane: 1,
    date: 2,
    card: 3,
    task: 4,
} as const

export type TagParentKind = keyof typeof TAG_PARENT

/** Mirrors ArcStrides.Contracts.Response.TagResponse */
export interface TagResponse
{
    id: string | null

    parentID: string | null

    parentTypeName: string | null

    title: string | null

    color: string | null
}

/** The tags a response carries, in the order they read: by title. */
export function mapTags(responses: TagResponse[] | null | undefined): Tag[]
{
    return (responses ?? []).filter(response => response.id)
                            .map(response => ({ id: response.id!, title: response.title ?? '', colour: response.color ?? null }))
                            .sort((a, b) => a.title.localeCompare(b.title))
}

/**
 * GET arcstrides/tags — every tag there is, each once: the ones on something,
 * and the ones on nothing now, whose last card or task was deleted or which
 * were taken off the last thing they were on. The server keeps those, so a tag
 * and its colour outlive what they were on (TagRepository.DetachLabelAsync).
 */
export async function fetchTagLibrary(): Promise<Tag[]>
{
    return mapTags(await apiClient.get<TagResponse[]>(`${ARC}/tags`))
}

/** PATCH arcstrides/tags/:id — a tag's colour, everywhere it is; null for the default. */
export async function updateTagColour(id: string, colour: string | null): Promise<void>
{
    await apiClient.patch(`${ARC}/tags/${id}`, [{ op: 'replace', path: '/color', value: colour }])
}

/**
 * Whether a tag in a draft is one the server has not seen: typed, not chosen.
 * Its ID is made up here until it is saved.
 */
export function isNewTag(tag: Tag): boolean
{
    return tag.id.startsWith(NEW_TAG)
}

/** A tag typed into a draft, with an ID of its own until the server gives it one. */
export function newTag(title: string): Tag
{
    return { id: `${NEW_TAG}${title.toLowerCase()}`, title, colour: null }
}

/**
 * Writes the difference between two lists of a thing's tags, and answers with
 * the tags it now has, each with the server's ID.
 *
 * A tag gone from the draft is taken off the thing only — it stays on everything
 * else. A typed one is put on by its title, which the server matches to a tag
 * that already has it, in any case; a chosen one by its ID.
 */
export async function saveTags(parent: { id: string; kind: TagParentKind }, saved: Tag[], draft: Tag[]): Promise<Tag[]>
{
    const savedIds = new Set(saved.map(tag => tag.id))
    const draftIds = new Set(draft.map(tag => tag.id))

    await Promise.all(saved.filter(tag => !draftIds.has(tag.id))
                           .map(tag => apiClient.delete(`${ARC}/tags/${tag.id}/parents/${parent.id}`)))

    const added = await Promise.all(draft.filter(tag => !savedIds.has(tag.id))
                                         .map(tag => apiClient.post<TagResponse>(`${ARC}/tags`, {
                                             ID: isNewTag(tag)
                                                 ? null
                                                 : tag.id,
                                             ParentID: parent.id,
                                             Title: tag.title,
                                             TypeID: TAG_PARENT[parent.kind],
                                         })))

    const kept = draft.filter(tag => savedIds.has(tag.id))
    return [...kept, ...mapTags(added)].sort((a, b) => a.title.localeCompare(b.title))
}

/** Whether two lists of tags are the same tags. */
export function sameTags(a: Tag[], b: Tag[]): boolean
{
    return a.length === b.length && a.every(tag => b.some(other => other.id === tag.id))
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

const NEW_TAG = 'new:'

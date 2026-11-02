/**
 * DeleteColumnOverlay
 *
 * Mirrors: DeleteColumnOverlay.razor + DeleteColumnOverlay.cs
 *
 * Blazor used index-aligned List<Guid> + List<string> to find the column by title,
 * then called RemoveAt() on both lists in lockstep. This was fragile — a mismatch
 * between the two lists would silently delete the wrong column.
 *
 * Here we work with Column objects directly. Selection gives us the column ID,
 * and we pass that to the API. No index alignment needed.
 *
 * The uniqueness validation (matchingColumnNameCount !== 1) is preserved:
 * duplicate column titles on the same board are treated as an error.
 *
 * ── Where the cards go ───────────────────────────────────────────────────────
 * Into the column that takes this one's place: the one after it, or the one
 * before it when it was the last (ColumnRepository). Said under the selector, so
 * deleting a full column is not a surprise.
 *
 * A card is always in a column, so the board's last column cannot simply go
 * while it holds cards; the server refuses. Here that becomes an offer: the
 * cards move to a new grey column, "Orphaned", made for them first, and the
 * column is deleted into it. A board can have no swimlanes, but not no columns
 * with cards on it.
 */

import React, { useState } from 'react'
import { Stack, Typography } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { ArcExpandingPicker } from '../../../Components/ArcExpandingPicker'
import { createColumn, deleteColumn } from '../Board.APIs'
import { NEUTRALS } from '../../../Styles/Palette'
import { useBoardActions } from '../Hooks/useBoardActions'
import { useShallow } from 'zustand/react/shallow'
import { useBoardStore } from '../Board.Store'

interface DeleteColumnOverlayProps
{
    open: boolean
    onClose: () => void
}

export const DeleteColumnOverlay: React.FC<DeleteColumnOverlayProps> = ({ open, onClose }) =>
{
    const { boardId, columns, cards } = useBoardStore(useShallow(state =>
    ({
        boardId: state.boardId,
        columns: state.columns,
        cards: state.cards,
    })))
    const { run } = useBoardActions()

    const [selectedTitle, setSelectedTitle] = useState<string | null>(null)

    const handleSelect = (title: string) =>
    {
        // Preserve Blazor's uniqueness guard
        const matches = columns.filter(column => column.title === title)
        if (matches.length !== 1)
        {
            console.error(`Expected exactly 1 column with title "${title}", found ${matches.length}`)
            return
        }
        setSelectedTitle(title)
    }

    const selected = columns.find(candidate => candidate.title === selectedTitle) ?? null
    const held = selected
        ? cards.filter(card => card.columnId === selected.id).length
        : 0
    // The last column, with cards in it: they need somewhere to go first.
    const orphaning = selected !== null && columns.length === 1 && held > 0

    const handleSubmit = async () =>
    {
        if (!boardId || !selected)
            return

        if (orphaning)
        {
            const made = await run('Making the Orphaned column',
                                   () => createColumn(boardId, { title: orphanTitle(columns.map(column => column.title)),
                                                                 order: columns.length,
                                                                 colour: ORPHANED_COLOUR,
                                                                 // No global colour: one would have to be
                                                                 // unique across every board, and this
                                                                 // column is a holding pen, not a step any
                                                                 // template means.
                                                                 globalColour: null }),
                                   { refresh: false })
            if (!made)
                return
        }

        // Deleting a column shifts the remaining orders and moves the cards that
        // were in it — the refresh inside run() picks all of that up.
        const deleted = await run('Deleting column', () => deleteColumn(boardId, selected.id))
        if (!deleted)
            return

        setSelectedTitle(null)
        onClose()
    }

    return (
        <ArcOverlay open={open}
                    onClose={onClose}
                    onSubmit={handleSubmit}
                    // A column chosen is the change: what Delete would do.
                    dirty={selectedTitle !== null}
                    // This overlay exists to delete, so the primary action is the
                    // delete — but it must not read as "Save".
                    submitLabel={orphaning
                        ? 'Delete, keep the cards'
                        : 'Delete Column'}
                    submitDestructive
                    title="Delete column"
                    titleStock="blue">
            <Stack spacing={1.5}>
                <ArcExpandingPicker options={columns.map(column => column.title)}
                                    onSelect={handleSelect}
                                    placeholder="Select column to delete" />

                { selected && (
                    <Typography role={orphaning
                                    ? 'alert'
                                    : undefined}
                                sx={{ fontSize: '0.78rem', color: 'arc.onGlass' }}>
                        { whereTheCardsGo(selected.order, columns.length, held) }
                    </Typography>
                )
                }
            </Stack>
        </ArcOverlay>
    )
}

export default DeleteColumnOverlay

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** Grey card: a column nobody chose, holding cards that had nowhere else to be. */
const ORPHANED_COLOUR = NEUTRALS.grey

/** "Orphaned", or "Orphaned 2" and on if a column already has the name. */
function orphanTitle(titles: string[]): string
{
    const taken = new Set(titles.map(title => title.trim().toLowerCase()))
    let title = 'Orphaned'
    for (let next = 2; taken.has(title.toLowerCase()); next++)
        title = `Orphaned ${next}`
    return title
}

/** What happens to a column's cards when it goes, in a sentence. */
function whereTheCardsGo(order: number, count: number, held: number): string
{
    const cards = held === 1
        ? 'Its card'
        : `Its ${held} cards`

    if (held === 0)
        return 'It holds no cards.'
    if (count === 1)
        return `This is the board's last column, and a card always sits in one. ${cards} will move to a new grey column, "Orphaned", made for them.`
    return order === count - 1
        ? `${cards} will move to the column before it.`
        : `${cards} will move to the column after it.`
}

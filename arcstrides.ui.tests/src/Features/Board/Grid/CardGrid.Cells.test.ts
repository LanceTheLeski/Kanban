/**
 * CardGrid.Cells.test.ts
 *
 * Which square of the grid a card is in, how the cards of a square are ordered,
 * and what a drag sends: the cards that moved and the ones it displaced, each
 * with a rank, so that every cell it touched is numbered 0 to n−1 with no gap
 * and no repeat. Cards are named by a letter, and a cell by "swimlane|column".
 *
 * Expectations are written out — 'A lane-1/doing #1', not a call to the module —
 * so that a change to the rule fails here rather than moving the test along
 * with it.
 */

import { describe, expect, it } from 'vitest'
import {
    cellId,
    groupCardsByCell,
    parseCellId,
    placementsForMove,
    type CardPlacement,
} from '@ui/Features/Board/Grid/CardGrid.Cells'
import type { Card } from '@ui/Entities/Card/Card.Types'
import type { Column, Swimlane } from '@ui/Features/Board/Board.Types'

describe('cellId', () =>
{
    it('names a cell by its swimlane and then its column', () =>
    {
        expect(cellId('lane-1', 'todo')).toBe('lane-1|todo')
    })
})

describe('parseCellId', () =>
{
    it('gives back the swimlane and the column a cell id was made from', () =>
    {
        const noSwimlane = '00000000-0000-0000-0000-000000000000'
        const column = '6f1c2b7e-3d94-4a0e-9b58-0c1d2e3f4a5b'

        expect(parseCellId('lane-1|todo')).toEqual({ swimlaneId: 'lane-1', columnId: 'todo' })
        expect(parseCellId(cellId(noSwimlane, column))).toEqual({ swimlaneId: noSwimlane, columnId: column })
    })

    it('rejects an id that has no separator, no swimlane or no column', () =>
    {
        expect(parseCellId('')).toBeNull()
        expect(parseCellId('lane-1')).toBeNull()
        expect(parseCellId('lane-1|')).toBeNull()
        expect(parseCellId('|todo')).toBeNull()
    })
})

describe('groupCardsByCell', () =>
{
    it('puts each card in the cell of its swimlane and its column, and makes no cell for an empty one', () =>
    {
        const groups = groupCardsByCell([
            card('A', 'lane-1', 'todo', 0),
            card('B', 'lane-1', 'doing', 0),
            card('C', 'lane-2', 'todo', 0),
            card('D', 'lane-1', 'todo', 1),
        ])

        expect([...groups.keys()].sort()).toEqual(['lane-1|doing', 'lane-1|todo', 'lane-2|todo'])
        expect(ids(groups.get('lane-1|todo'))).toEqual(['A', 'D'])
        expect(ids(groups.get('lane-1|doing'))).toEqual(['B'])
        expect(ids(groups.get('lane-2|todo'))).toEqual(['C'])
        expect(groups.has('lane-2|doing')).toBe(false)
        expect(groupCardsByCell([]).size).toBe(0)
    })

    it('orders the cards of a cell by their rank, whatever order they came in', () =>
    {
        const groups = groupCardsByCell([card('C', 'lane-1', 'todo', 2), card('A', 'lane-1', 'todo', 0), card('B', 'lane-1', 'todo', 1)])

        expect(ids(groups.get('lane-1|todo'))).toEqual(['A', 'B', 'C'])
    })

    it('orders cards that share a rank by their title, so they do not swap from one render to the next', () =>
    {
        const forwards = groupCardsByCell([card('Beta', 'lane-1', 'todo', 0), card('Alpha', 'lane-1', 'todo', 0), card('Gamma', 'lane-1', 'todo', 0)])
        const backwards = groupCardsByCell([card('Gamma', 'lane-1', 'todo', 0), card('Alpha', 'lane-1', 'todo', 0), card('Beta', 'lane-1', 'todo', 0)])

        expect(ids(forwards.get('lane-1|todo'))).toEqual(['Alpha', 'Beta', 'Gamma'])
        expect(ids(backwards.get('lane-1|todo'))).toEqual(['Alpha', 'Beta', 'Gamma'])
    })
})

describe('placementsForMove', () =>
{
    it('sends nothing for a card that is not there, or for a drop that leaves a card where it is', () =>
    {
        const cards = inCell('lane-1', 'todo', 'A', 'B', 'C')

        expect(placementsForMove(cards, 'Z', column('todo'), lane('lane-1'), 0)).toEqual([])
        expect(placementsForMove(cards, 'B', column('todo'), lane('lane-1'), 1)).toEqual([])
    })

    it('puts a card dragged down onto its neighbour below it, and one dragged up above it', () =>
    {
        const cards = inCell('lane-1', 'todo', 'A', 'B', 'C')

        expect(summary(placementsForMove(cards, 'A', column('todo'), lane('lane-1'), 1)))
            .toEqual(['A lane-1/todo #1', 'B lane-1/todo #0'])
        expect(summary(placementsForMove(cards, 'C', column('todo'), lane('lane-1'), 1)))
            .toEqual(['B lane-1/todo #2', 'C lane-1/todo #1'])
        expect(summary(placementsForMove(cards, 'C', column('todo'), lane('lane-1'), 0)))
            .toEqual(['A lane-1/todo #1', 'B lane-1/todo #2', 'C lane-1/todo #0'])
    })

    it('reads an index outside the cell as the nearest end of it', () =>
    {
        const cards = inCell('lane-1', 'todo', 'A', 'B', 'C')

        expect(summary(placementsForMove(cards, 'A', column('todo'), lane('lane-1'), 99)))
            .toEqual(['A lane-1/todo #2', 'B lane-1/todo #0', 'C lane-1/todo #1'])
        expect(summary(placementsForMove(cards, 'C', column('todo'), lane('lane-1'), -4)))
            .toEqual(['A lane-1/todo #1', 'B lane-1/todo #2', 'C lane-1/todo #0'])
    })

    it('renumbers a cell whose ranks have gaps or repeats, even for a drop that moves nothing', () =>
    {
        const gaps = [card('A', 'lane-1', 'todo', 0), card('B', 'lane-1', 'todo', 5), card('C', 'lane-1', 'todo', 9)]
        const repeats = [card('B', 'lane-1', 'todo', 0), card('A', 'lane-1', 'todo', 0), card('C', 'lane-1', 'todo', 1)]

        expect(summary(placementsForMove(gaps, 'A', column('todo'), lane('lane-1'), 0)))
            .toEqual(['B lane-1/todo #1', 'C lane-1/todo #2'])
        expect(summary(placementsForMove(repeats, 'A', column('todo'), lane('lane-1'), 0)))
            .toEqual(['B lane-1/todo #1', 'C lane-1/todo #2'])
    })

    it('moves a card into another cell at the index it was dropped at, and closes the gap it left behind', () =>
    {
        const cards = [...inCell('lane-1', 'todo', 'A', 'B', 'C'), ...inCell('lane-1', 'doing', 'X', 'Y')]

        expect(summary(placementsForMove(cards, 'A', column('doing'), lane('lane-1'), 1)))
            .toEqual(['A lane-1/doing #1', 'B lane-1/todo #0', 'C lane-1/todo #1', 'Y lane-1/doing #2'])
    })

    it('numbers both cells from 0 when their ranks had gaps', () =>
    {
        const cards =
        [
            card('A', 'lane-1', 'todo', 0),
            card('B', 'lane-1', 'todo', 4),
            card('C', 'lane-1', 'todo', 9),
            card('X', 'lane-1', 'doing', 2),
            card('Y', 'lane-1', 'doing', 7),
        ]

        const placements = placementsForMove(cards, 'B', column('doing'), lane('lane-1'), 0)

        expect(summary(placements))
            .toEqual(['B lane-1/doing #0', 'C lane-1/todo #1', 'X lane-1/doing #1', 'Y lane-1/doing #2'])
        expect(ranksByCell(applied(cards, placements))).toEqual({ 'lane-1|todo': [0, 1], 'lane-1|doing': [0, 1, 2] })
    })

    it('puts a card dropped past the end of a cell last, and one dropped on an empty cell first', () =>
    {
        const cards = [...inCell('lane-1', 'todo', 'A', 'B'), ...inCell('lane-1', 'doing', 'X', 'Y')]

        expect(summary(placementsForMove(cards, 'A', column('doing'), lane('lane-1'), 99)))
            .toEqual(['A lane-1/doing #2', 'B lane-1/todo #0'])
        expect(summary(placementsForMove(cards, 'A', column('done'), lane('lane-1'), 3)))
            .toEqual(['A lane-1/done #0', 'B lane-1/todo #0'])
    })

    it('counts the same column in another swimlane as another cell, even where the rank stays the same', () =>
    {
        const cards = inCell('lane-1', 'todo', 'A', 'B', 'C')

        expect(summary(placementsForMove(cards, 'A', column('todo'), lane('lane-2'), 0)))
            .toEqual(['A lane-2/todo #0', 'B lane-1/todo #0', 'C lane-1/todo #1'])
    })

    it('puts the moved card in the cell it was dropped on, and a displaced sibling where its own copy says it is', () =>
    {
        const urgent = { swimlaneName: 'Urgent', swimlaneNumber: 1, columnName: 'To do', columnNumber: 0 }
        const cards = [{ ...card('A', 'lane-1', 'todo', 0), ...urgent }, { ...card('B', 'lane-1', 'todo', 1), ...urgent }]
        const done = column('done', 2)
        const lane1 = lane('lane-1')

        const placements = placementsForMove(cards, 'A', done, lane1, 0)

        expect(placements.find(placement => placement.cardId === 'A')?.column).toBe(done)
        expect(placements.find(placement => placement.cardId === 'A')?.swimlane).toBe(lane1)
        expect(placements.find(placement => placement.cardId === 'B')?.column).toEqual({ id: 'todo', title: 'To do', order: 0 })
        expect(placements.find(placement => placement.cardId === 'B')?.swimlane).toEqual({ id: 'lane-1', title: 'Urgent', order: 1 })
    })

    it('leaves every cell numbered 0 to n−1 whichever card is dropped on whichever cell at whichever index', () =>
    {
        const cards = [...inCell('lane-1', 'todo', 'A', 'B', 'C'), ...inCell('lane-1', 'doing', 'X', 'Y'), ...inCell('lane-2', 'todo', 'Z')]
        const targets = [['lane-1', 'todo'], ['lane-1', 'doing'], ['lane-2', 'todo'], ['lane-2', 'doing']]

        for (const moving of cards)
            for (const [swimlaneId, columnId] of targets)
                for (let index = -1; index <= 4; index++)
                {
                    const placements = placementsForMove(cards, moving.id, column(columnId), lane(swimlaneId), index)

                    for (const ranks of Object.values(ranksByCell(applied(cards, placements))))
                        expect(ranks).toEqual(ranks.map((_, position) => position))
                }
    })
})

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** The ids of some cards; none, for a cell the test expected to be there and was not. */
function ids(cards: Card[] | undefined): string[]
{
    return (cards ?? []).map(candidate => candidate.id)
}

/** A card in a cell at a rank. Its title is its id, so ids read as titles. */
function card(id: string, swimlaneId: string, columnId: string, positionRank: number): Card
{
    return {
        id,
        positionId: `position-${id}`,
        boardId: 'board-1',
        title: id,
        description: '',
        columnNumber: 0,
        columnId,
        columnName: columnId,
        swimlaneNumber: 0,
        swimlaneId,
        swimlaneName: swimlaneId,
        positionRank,
        tasks: [],
        timeline: null,
        overridesTasks: null,
        tags: [],
    }
}

/** Cards named by their ids, in a cell, ranked 0, 1, 2 in the order given. */
function inCell(swimlaneId: string, columnId: string, ...cardIds: string[]): Card[]
{
    return cardIds.map((id, index) => card(id, swimlaneId, columnId, index))
}

/** What each placement says, as "A lane-1/doing #1", ordered by card, so a test does not depend on the order they were made in. */
function summary(placements: CardPlacement[]): string[]
{
    return placements.map(placement => `${placement.cardId} ${placement.swimlane.id}/${placement.column.id} #${placement.positionRank}`)
                     .sort()
}

/** A column, titled by its id. */
function column(id: string, order: number = 0): Column
{
    return { id, title: id, order, colour: null, globalColour: null }
}

/** A swimlane, titled by its id. */
function lane(id: string, order: number = 0): Swimlane
{
    return { id, title: id, order, colour: null, globalColour: null }
}

/** The cards as they stand once the server has written the placements. */
function applied(cards: Card[], placements: CardPlacement[]): Card[]
{
    return cards.map(candidate =>
    {
        const placement = placements.find(found => found.cardId === candidate.id)
        if (!placement)
            return candidate

        return { ...candidate, columnId: placement.column.id, swimlaneId: placement.swimlane.id, positionRank: placement.positionRank }
    })
}

/** Each cell's ranks, lowest first: { 'lane-1|todo': [0, 1, 2] }. */
function ranksByCell(cards: Card[]): Record<string, number[]>
{
    const ranks: Record<string, number[]> = {}

    for (const candidate of cards)
        (ranks[`${candidate.swimlaneId}|${candidate.columnId}`] ??= []).push(candidate.positionRank)

    for (const cell of Object.values(ranks))
        cell.sort((a, b) => a - b)

    return ranks
}

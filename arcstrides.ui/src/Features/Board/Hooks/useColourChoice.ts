/**
 * useColourChoice
 *
 * The two colours a column or swimlane has, chosen as one: the colour it is
 * drawn in on this board, and its global colour, which says which column it is
 * across boards built from the same template.
 *
 * ── One pick, two colours ────────────────────────────────────────────────────
 * Normally they are the same, and picking one picks both. They part only when
 * the colour picked is already another column's global colour — on any board —
 * because no two columns may share one (no two swimlanes either; a column and
 * a swimlane may). The board keeps the colour picked; the global colour has to
 * be another, and GlobalColourPanel offers the nearest free shade of it.
 *
 * ── A suggestion until something is picked ───────────────────────────────────
 * A new column is offered the next shade along from its neighbour's colour
 * (Board.Colours, suggestedColour), and follows its place in the list as it
 * moves, until a colour is picked by hand. Then it keeps that one.
 */

import { useEffect, useState } from 'react'
import { fetchGlobalColours, type GlobalColourHolder } from '../Board.APIs'
import { freeShade, sameColour } from '../Board.Colours'

export interface ColourChoice
{
    /** The board's colour: picked, or the suggestion until something is. Null is the ramp. */
    colour: string | null

    /** Whether `colour` is the suggestion, not a pick. */
    suggested: boolean

    pick: (colour: string | null) => void

    /** Starts from a column's colours as stored, as a pick: for editing one. */
    load: (colour: string | null, globalColour: string | null) => void

    /** Whose global colour the board's colour already is, if anyone's. */
    takenBy: GlobalColourHolder | null

    /** The global colour chosen in place of a taken one, or the free shade offered. */
    override: string | null

    setOverride: (colour: string | null) => void

    /** What is offered for `override` until one is chosen. */
    offered: string | null

    /** Whose global colour the override is too, if anyone's. */
    overrideTakenBy: GlobalColourHolder | null

    /** What is sent as the global colour. */
    globalColour: string | null
}

export function useColourChoice(kind: 'column' | 'swimlane', excludeId: string | null, suggestion: string | null): ColourChoice
{
    const holders = useGlobalColourHolders(kind)
    const [chosen, setChosen] = useState<string | null>(null)
    const [picked, setPicked] = useState(false)
    // Undefined until the override is chosen by hand: the offer stands in for it.
    const [override, setOverride] = useState<string | null | undefined>(undefined)

    const holderOf = (colour: string | null) => (colour
        ? holders.find(holder => holder.id !== excludeId && sameColour(holder.globalColour, colour)) ?? null
        : null)

    const colour = picked
        ? chosen
        : suggestion
    const takenBy = holderOf(colour)
    const offered = takenBy && colour
        ? freeShade(colour, candidate => holderOf(candidate) !== null)
        : null
    const resolvedOverride = override === undefined
        ? offered
        : override

    return {
        colour,
        suggested: !picked && colour !== null,
        pick: next =>
        {
            setChosen(next)
            setPicked(true)
            setOverride(undefined)
        },
        load: (stored, storedGlobal) =>
        {
            setChosen(stored)
            setPicked(true)
            setOverride(storedGlobal && !sameColour(storedGlobal, stored)
                ? storedGlobal
                : undefined)
        },
        takenBy,
        override: resolvedOverride,
        setOverride,
        offered,
        overrideTakenBy: takenBy
            ? holderOf(resolvedOverride)
            : null,
        globalColour: colour === null
            ? null
            : takenBy
                ? resolvedOverride
                : colour,
    }
}

export default useColourChoice

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/**
 * Every column (or swimlane) on every board with a global colour, read when the
 * overlay opens. A failed read leaves the list empty: nothing is flagged here,
 * and the server, which checks again, says so on save.
 */
function useGlobalColourHolders(kind: 'column' | 'swimlane'): GlobalColourHolder[]
{
    const [holders, setHolders] = useState<GlobalColourHolder[]>([])

    useEffect(() =>
    {
        let live = true
        fetchGlobalColours(kind === 'column'
            ? 'columns'
            : 'swimlanes')
            .then(found =>
            {
                if (live)
                    setHolders(found)
            })
            .catch(() => undefined)
        return () =>
        {
            live = false
        }
    }, [kind])

    return holders
}

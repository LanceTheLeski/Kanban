/**
 * Board.Colours.test.ts
 *
 * What colour a column or a swimlane is: the one it was given, else its place on
 * a ramp; the colour offered to one added between two others; whether a colour
 * was changed. Colours are the palette's, taken from LADDERS. A ramp's ends are
 * the palette's steps written as rgb(), and what lies between is judged by
 * brightness, which falls from the pale end to the deep one.
 *
 * Expectations are written out — the blue ladder's ground, not a call to the
 * module's ramp — so that a change to the rule fails here rather than moving the
 * test along with it.
 */

import { describe, expect, it } from 'vitest'
import {
    colourChanged,
    columnColour,
    freeShade,
    sameColour,
    suggestedColour,
    swimlaneColour,
} from '@ui/Features/Board/Board.Colours'
import { LADDERS } from '@ui/Styles/Palette'

describe('sameColour', () =>
{
    it('ignores case, the spaces round a colour, and whether it is written as hex or as rgb()', () =>
    {
        expect(sameColour(LADDERS.red.mid, LADDERS.red.mid.toUpperCase())).toBe(true)
        expect(sameColour(LADDERS.red.mid, ` ${LADDERS.red.mid} `)).toBe(true)
        expect(sameColour(LADDERS.red.mid, asRgb(LADDERS.red.mid))).toBe(true)
    })

    it('tells two different colours apart', () =>
    {
        expect(sameColour(LADDERS.red.mid, LADDERS.red.ground)).toBe(false)
        expect(sameColour(LADDERS.red.mid, LADDERS.blue.mid)).toBe(false)
    })

    it('is not true when either colour is absent, even when both are', () =>
    {
        expect(sameColour(LADDERS.red.mid, null)).toBe(false)
        expect(sameColour(undefined, LADDERS.red.mid)).toBe(false)
        expect(sameColour(null, null)).toBe(false)
        expect(sameColour('', undefined)).toBe(false)
    })
})

describe('colourChanged', () =>
{
    it('is no change from no colour to no colour', () =>
    {
        expect(colourChanged(null, null)).toBe(false)
        expect(colourChanged(undefined, null)).toBe(false)
        expect(colourChanged('', null)).toBe(false)
    })

    it('is no change when only the case, the spacing or the notation of a colour differs', () =>
    {
        expect(colourChanged(LADDERS.red.mid.toUpperCase(), LADDERS.red.mid)).toBe(false)
        expect(colourChanged(` ${LADDERS.red.mid} `, LADDERS.red.mid)).toBe(false)
        expect(colourChanged(asRgb(LADDERS.red.mid), LADDERS.red.mid)).toBe(false)
    })

    it('is a change when a colour is set, cleared or replaced', () =>
    {
        expect(colourChanged(LADDERS.red.mid, null)).toBe(true)
        expect(colourChanged(null, LADDERS.red.mid)).toBe(true)
        expect(colourChanged(LADDERS.red.ground, LADDERS.red.mid)).toBe(true)
    })
})

describe('freeShade', () =>
{
    it('offers the nearest shade nobody has taken: lighter first, then darker, then two lighter, then two darker', () =>
    {
        const lighter = freeShade(LADDERS.red.mid, () => false)
        const darker = freeShade(LADDERS.red.mid, shade => shade === lighter)
        const twoLighter = freeShade(LADDERS.red.mid, shade => [lighter, darker].includes(shade))
        const twoDarker = freeShade(LADDERS.red.mid, shade => [lighter, darker, twoLighter].includes(shade))

        expect(brightness(lighter)).toBeGreaterThan(brightness(LADDERS.red.mid))
        expect(brightness(darker)).toBeLessThan(brightness(LADDERS.red.mid))
        expect(brightness(twoLighter)).toBeGreaterThan(brightness(lighter))
        expect(brightness(twoDarker)).toBeLessThan(brightness(darker))
    })

    it('offers the first shade that is not taken, and never asks about the colour itself', () =>
    {
        const asked: string[] = []

        const offered = freeShade(LADDERS.red.mid, shade =>
        {
            asked.push(shade)
            return asked.length < 5
        })

        expect(asked).toHaveLength(5)
        expect(offered).toBe(asked[4])
        expect(asked).not.toContain(LADDERS.red.mid)
    })

    it('gives the colour itself, as hex, when every shade is taken', () =>
    {
        expect(freeShade(LADDERS.red.mid, () => true)).toBe(LADDERS.red.mid)
        expect(freeShade(asRgb(LADDERS.red.mid), () => true)).toBe(LADDERS.red.mid)
    })
})

describe('columnColour', () =>
{
    it('uses the colour a column has been given, without the spaces round it', () =>
    {
        expect(columnColour(LADDERS.green.mid, 0, 4)).toBe(LADDERS.green.mid)
        expect(columnColour(` ${LADDERS.green.mid} `, 3, 4)).toBe(LADDERS.green.mid)
    })

    it('runs a column with no colour from the blue ground on the left to the blue mid on the right, deeper at each step', () =>
    {
        const across = [0, 1, 2, 3].map(index => columnColour(null, index, 4))

        expect(across[0]).toBe(asRgb(LADDERS.blue.ground))
        expect(across[3]).toBe(asRgb(LADDERS.blue.mid))
        expect(brightness(across[0])).toBeGreaterThan(brightness(across[1]))
        expect(brightness(across[1])).toBeGreaterThan(brightness(across[2]))
        expect(brightness(across[2])).toBeGreaterThan(brightness(across[3]))
        expect(columnColour(undefined, 3, 4)).toBe(across[3])
        expect(columnColour('   ', 3, 4)).toBe(across[3])
    })

    it('spreads the ramp over the whole board, whether it has two columns or nine, and gives a board of one the pale end', () =>
    {
        for (const total of [2, 3, 9])
        {
            expect(columnColour(null, 0, total)).toBe(asRgb(LADDERS.blue.ground))
            expect(columnColour(null, total - 1, total)).toBe(asRgb(LADDERS.blue.mid))
        }

        expect(columnColour(null, 0, 1)).toBe(asRgb(LADDERS.blue.ground))
    })
})

describe('swimlaneColour', () =>
{
    it('uses the colour a swimlane has been given, without the spaces round it', () =>
    {
        expect(swimlaneColour(LADDERS.green.mid, 0, 3)).toBe(LADDERS.green.mid)
        expect(swimlaneColour(` ${LADDERS.green.mid} `, 2, 3)).toBe(LADDERS.green.mid)
    })

    it('runs a swimlane with no colour from the red mid at the top to the red ground at the bottom, paler at each step', () =>
    {
        const down = [0, 1, 2, 3].map(index => swimlaneColour(null, index, 4))

        expect(down[0]).toBe(asRgb(LADDERS.red.mid))
        expect(down[3]).toBe(asRgb(LADDERS.red.ground))
        expect(brightness(down[0])).toBeLessThan(brightness(down[1]))
        expect(brightness(down[1])).toBeLessThan(brightness(down[2]))
        expect(brightness(down[2])).toBeLessThan(brightness(down[3]))
    })
})

describe('suggestedColour', () =>
{
    it('offers what follows the neighbour before it: deeper for a column, paler for a swimlane', () =>
    {
        expect(brightness(suggestedColour('column', LADDERS.blue.mid, null))).toBeLessThan(brightness(LADDERS.blue.mid))
        expect(brightness(suggestedColour('swimlane', LADDERS.red.mid, null))).toBeGreaterThan(brightness(LADDERS.red.mid))
    })

    it('offers what goes before the neighbour after it when it goes first: paler for a column, deeper for a swimlane', () =>
    {
        expect(brightness(suggestedColour('column', null, LADDERS.blue.mid))).toBeGreaterThan(brightness(LADDERS.blue.mid))
        expect(brightness(suggestedColour('swimlane', null, LADDERS.red.mid))).toBeLessThan(brightness(LADDERS.red.mid))
    })

    it('goes by the neighbour before it when both have a colour', () =>
    {
        expect(suggestedColour('column', LADDERS.blue.mid, LADDERS.green.mid)).toBe(suggestedColour('column', LADDERS.blue.mid, null))
    })

    it('offers nothing when neither neighbour has a colour of its own, since they and the new one are on the ramp', () =>
    {
        expect(suggestedColour('column', null, null)).toBeNull()
        expect(suggestedColour('swimlane', '', '   ')).toBeNull()
    })
})

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** A palette colour as the ramps write one: its hex as rgb(red, green, blue). */
function asRgb(hex: string): string
{
    const [red, green, blue] = channels(hex)
    return `rgb(${red}, ${green}, ${blue})`
}

/** How pale a colour is: the mean of its channels, so higher is paler. Not a number for no colour, which no comparison passes. */
function brightness(colour: string | null): number
{
    if (colour === null)
        return NaN

    const [red, green, blue] = channels(colour)
    return (red + green + blue) / 3
}

/** The red, green and blue of a colour written as hex or as rgb(red, green, blue). */
function channels(colour: string): number[]
{
    if (colour.startsWith('#'))
        return [1, 3, 5].map(start => parseInt(colour.slice(start, start + 2), 16))

    return (colour.match(/\d+/g) ?? []).map(Number)
}

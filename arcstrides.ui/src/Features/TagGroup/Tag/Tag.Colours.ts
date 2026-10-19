/**
 * Tag.Colours
 *
 * How a tag is coloured: its own colour, chosen from the board's Tags menu
 * (TagColoursOverlay), or the red it has always been.
 *
 * A tag is a small piece of card cut from the red stock (.paper-red). A colour
 * of its own replaces the stock's ground, `--arc-paper`, and the card's grain,
 * its lit face and its shadow are worked out from that as they are for every
 * other stock — so a coloured tag is still a piece of card, not a painted chip.
 * It goes in an inline style rather than sx because the stylesheet's .paper-*
 * classes win over sx at equal specificity (see ArcPopover, triggerClassName).
 *
 * A tag's name is dark text, as a column's is, so the colours to choose from are
 * the palette's grounds and mids (ArcColourPicker); a deep mixed by hand is
 * allowed and reads poorly.
 */

import type { CSSProperties } from 'react'
import { LADDERS } from '../../../Styles/Palette'

/** The colour a tag has with none of its own: the red stock's ground. */
export const DEFAULT_TAG_COLOUR = LADDERS.red.ground

/** The inline style that gives a tag's piece of card its own colour; none for the default. */
export function tagStyle(colour: string | null): CSSProperties | undefined
{
    return colour
        ? { '--arc-paper': colour } as CSSProperties
        : undefined
}

/**
 * ArcColourPicker
 *
 * The ground a column header or swimlane label is written on, chosen from the
 * ramp it would otherwise be given.
 *
 * ── Why swatches and not a colour wheel ──────────────────────────────────────
 * The board already decides this well: columns run pale blue to deep, swimlanes
 * strong red to pale — the caller passes the ramp in, which is what keeps this
 * component free of any opinion about boards. The picker exists so somebody can
 * override that, not so they can start from nothing — a free colour input on a
 * board like this mostly produces one column nobody can read the title of.
 *
 * So the offer is the ramp itself, laid out as six pieces of card, plus a way
 * back to "let the board decide". Anything past that is a different feature
 * with different problems: contrast checking, and a palette that survives
 * somebody choosing white.
 *
 * ── Default ──────────────────────────────────────────────────────────────────
 * Null is a real value here, not an absence. It means the column has no opinion
 * and takes its place on the ramp, which is what almost every column should do:
 * a board where three of nine columns were coloured by hand is a board whose
 * ramp is broken. The Default chip is first, and is what a new column starts on.
 */

import React from 'react'
import { Box, ButtonBase, Typography } from '@mui/material'
import { labelStyle } from '../Styles/Stock'

interface ArcColourPickerProps {
    /** The chosen colour, or null for "let the board decide". */
    value: string | null
    onChange: (colour: string | null) => void
    /** The ramp to offer, from Board.Colours. */
    swatches: string[]
    label: string
}

export const ArcColourPicker: React.FC<ArcColourPickerProps> = ({ value, onChange, swatches, label }) => (
    <Box className="card-stock" sx={{ p: 0.75, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'arc.onPaperStrong' }}>
            {label}
        </Typography>

        <Box role="radiogroup"
             aria-label={label}
             sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            <Swatch label="Default"
                    selected={value === null}
                    onSelect={() => onChange(null)} />

            {swatches.map(colour => (
                <Swatch key={colour}
                        colour={colour}
                        label={colour}
                        selected={value === colour}
                        onSelect={() => onChange(colour)} />
            ))}
        </Box>
    </Box>
)

export default ArcColourPicker

// ── Private ───────────────────────────────────────────────────────────────────

/**
 * One choice, as a piece of card in the colour it stands for.
 *
 * `card-stock-flat` rather than `card-stock`, and the chosen one lifts — the
 * same "raised means chosen" the timeline's mode tabs use, so selection means
 * one thing in this app rather than two.
 */
const Swatch: React.FC<{
    colour?: string
    label: string
    selected: boolean
    onSelect: () => void
}> = ({ colour, label, selected, onSelect }) => (
    <ButtonBase role="radio"
                aria-checked={selected}
                aria-label={colour ? `Colour ${label}` : label}
                onClick={onSelect}
                className={selected ? 'card-stock board-label' : 'card-stock-flat board-label'}
                style={colour ? labelStyle(colour) : undefined}
                sx={{ minWidth: 34,
                      height: 24,
                      px: 0.75,
                      borderRadius: '2px',
                      transform: selected ? 'translateY(-1px)' : 'none',
                      transition: 'transform .12s' }}>
        {!colour && (
            <Typography sx={{ fontSize: '0.6rem',
                              fontWeight: selected ? 700 : 500,
                              color: 'arc.onPaperStrong' }}>
                {label}
            </Typography>
        )}
    </ButtonBase>
)

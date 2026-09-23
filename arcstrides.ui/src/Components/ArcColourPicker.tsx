/**
 * ArcColourPicker
 *
 * Any colour at all for a column or swimlane, or none — and "none" means the
 * board decides.
 *
 * ── Why a full picker now ────────────────────────────────────────────────────
 * It was six swatches cut from the board's own ramp. That kept every choice
 * readable and made most choices impossible: a team whose "Blocked" column is
 * red had no red to pick. The picker is react-colorful — a saturation field and
 * a hue strip, 2.8 kB, no dependencies — with a hex field beside it for anyone
 * who already knows the value they want.
 *
 * ── Default is a real value ──────────────────────────────────────────────────
 * Null means the column has no colour of its own and takes its place on the
 * ramp, which is what most columns should do: a board where three of nine were
 * coloured by hand is a board whose ramp is broken. So "Use default" is a button
 * that puts it back, not a missing value — and while it is the default, the
 * picker shows the ramp's colour so there is somewhere to start dragging from.
 */

import React from 'react'
import { Box, Button, Typography } from '@mui/material'
import { HexColorInput, HexColorPicker } from 'react-colorful'
import { labelStyle, toHex } from '../Styles/Stock'

interface ArcColourPickerProps {
    /** The chosen colour, or null for "let the board decide". */
    value: string | null
    onChange: (colour: string | null) => void
    /** What the board would use if nothing is chosen — shown while `value` is null. */
    fallback: string
    label: string
}

export const ArcColourPicker: React.FC<ArcColourPickerProps> = ({ value, onChange, fallback, label }) => {
    const shown = toHex(value ?? fallback)
    const isDefault = value === null

    return (
        <Box className="card-stock"
             sx={{ p: 0.75,
                   display: 'flex',
                   flexDirection: 'column',
                   gap: 0.75,
                   // react-colorful draws its own rounded field and slider; these
                   // bring the corners and the pointer in line with the card
                   // they sit on.
                   '& .react-colorful': { width: '100%', height: '9.5rem' },
                   '& .react-colorful__saturation': { borderRadius: '3px 3px 0 0' },
                   '& .react-colorful__last-control': { borderRadius: '0 0 3px 3px' },
                   '& .react-colorful__pointer': { width: 18, height: 18 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: '0.68rem',
                                  fontWeight: 700,
                                  color: 'arc.onPaperStrong',
                                  flex: 1 }}>
                    {label}
                </Typography>

                {/* The chosen colour on a chip, with its value — or "Default" while the board decides. */}
                <Box className="board-label"
                     aria-hidden
                     style={labelStyle(shown)}
                     sx={{ px: 1, py: 0.2, fontSize: '0.62rem', fontWeight: 700 }}>
                    {isDefault ? 'Default' : shown}
                </Box>
            </Box>

            <HexColorPicker color={shown} onChange={onChange} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box component="label"
                     sx={{ display: 'flex',
                           alignItems: 'center',
                           gap: 0.5,
                           flex: 1,
                           fontSize: '0.65rem',
                           color: 'arc.onPaperMuted',
                           '& input': { flex: 1,
                                        minWidth: 0,
                                        font: 'inherit',
                                        fontFamily: 'ui-monospace, monospace',
                                        fontSize: '0.72rem',
                                        color: '#22262c',
                                        padding: '3px 6px',
                                        border: 'none',
                                        borderRadius: '2px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.6)' } }}>
                    Hex
                    <HexColorInput color={shown} onChange={onChange} prefixed />
                </Box>

                <Button size="small"
                        onClick={() => onChange(null)}
                        disabled={isDefault}
                        sx={{ fontSize: '0.62rem', color: 'arc.onPaper', textTransform: 'none' }}>
                    Use default
                </Button>
            </Box>
        </Box>
    )
}

export default ArcColourPicker

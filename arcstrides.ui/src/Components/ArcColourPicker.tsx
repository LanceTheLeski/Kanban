/**
 * ArcColourPicker
 *
 * A colour for a column or swimlane, or none — and "none" means the board
 * decides.
 *
 *   ┌───────────────────────────────────────────────┐
 *   │ Column colour                       [Default] │
 *   │ PAPER  ▭ ▭ ▭ ▭ ▭ ▭ ▭ ▭                         │
 *   │ YOURS  ▭ ▭  [● Mix…]                           │
 *   │                                   Use default │
 *   └───────────────────────────────────────────────┘
 *
 * ── Chips first, the full picker when asked for ─────────────────────────────
 * It was six swatches cut from the board's own ramp, then a full picker — a
 * saturation field and a hue strip from react-colorful, with a hex field —
 * open in the dialog all the time, which made it the largest thing in a dialog
 * about a title. Most choices are one of a few colours, so those come first,
 * as chips of card:
 *
 *   Paper   the palette's grounds and mids (Styles/Palette), so a column coloured
 *           by hand is still cut from the same papers as everything else. The
 *           deeps are left out: a label's name is dark text.
 *   Yours   colours saved from the picker, for a team whose "Blocked" is always
 *           the same red. Kept in this browser (localStorage) — there is nowhere
 *           on the server for them yet, and a preference like this can wait
 *           for one.
 *
 * and "Mix…" opens the full picker in a popover, with "Save to yours" in it.
 *
 * ── Default is a real value ──────────────────────────────────────────────────
 * Null means the column has no colour of its own and takes its place on the
 * ramp, which is what most columns should do: a board where three of nine were
 * coloured by hand is a board whose ramp is broken. So "Use default" is a button
 * that puts it back, not a missing value — and while it is the default, the
 * picker shows the ramp's colour so there is somewhere to start mixing from.
 */

import React, { useState } from 'react'
import { Box, Button, IconButton, Popover, Typography } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import { HexColorInput, HexColorPicker } from 'react-colorful'
import { labelStyle, rgbOf, toHex } from '../Styles/Stock'
import { LADDERS } from '../Styles/Palette'

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
    const [saved, setSaved] = useState<string[]>(readSaved)
    const [mixing, setMixing] = useState<HTMLElement | null>(null)

    const onPaper = PAPER.some(swatch => swatch.colour === shown)
    const mixed = !isDefault && !onPaper && !saved.includes(shown)

    const keep = (next: string[]) => {
        setSaved(next)
        writeSaved(next)
    }

    return (
        <Box className="card-stock" sx={{ p: 0.75, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
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

            <ChipRow label="Paper">
                {PAPER.map((swatch, index) => (
                    <Chip key={swatch.colour}
                          colour={swatch.colour}
                          name={swatch.name}
                          tilt={index}
                          chosen={!isDefault && shown === swatch.colour}
                          onPick={() => onChange(swatch.colour)} />
                ))}
            </ChipRow>

            <ChipRow label="Yours">
                {saved.map((colour, index) => (
                    <Chip key={colour}
                          colour={colour}
                          name={`Saved colour ${colour}`}
                          tilt={index + 1}
                          chosen={!isDefault && shown === colour}
                          onPick={() => onChange(colour)}
                          onRemove={() => keep(saved.filter(other => other !== colour))} />
                ))}

                {/*
                    The full picker, behind a chip of plain card. While the colour
                    is one mixed here and not saved, its dot is on the chip, so the
                    choice is still visible somewhere in the row.
                */}
                <Box component="button"
                     type="button"
                     className="card-stock-flat card-cut"
                     onClick={event => setMixing(event.currentTarget)}
                     aria-haspopup="dialog"
                     aria-label={mixed ? `Mix a colour — now ${shown}` : 'Mix a colour'}
                     sx={{ display: 'inline-flex',
                           alignItems: 'center',
                           gap: 0.4,
                           height: CHIP_HEIGHT,
                           px: 0.75,
                           border: 'none',
                           cursor: 'pointer',
                           font: 'inherit',
                           fontSize: '0.62rem',
                           fontWeight: 700,
                           color: 'arc.onPaper',
                           '&:hover': { color: 'arc.onPaperStrong' },
                           '&:focus-visible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 } }}>
                    {mixed
                        ? <Box component="span" sx={{ width: 10,
                                                      height: 10,
                                                      borderRadius: '50%',
                                                      backgroundColor: shown,
                                                      boxShadow: '0 0 0 1px rgba(0, 0, 0, .2)' }} />
                        : <PaletteOutlinedIcon sx={{ fontSize: '0.8rem' }} />}
                    Mix…
                </Box>
            </ChipRow>

            {saved.length === 0 && (
                <Typography sx={{ fontSize: '0.6rem',
                                  color: 'arc.onPaperMuted',
                                  pl: `${ROW_LABEL_WIDTH}px` }}>
                    Mix a colour and save it, and it stays here.
                </Typography>
            )}

            <Button size="small"
                    onClick={() => onChange(null)}
                    disabled={isDefault}
                    sx={{ alignSelf: 'flex-end',
                          fontSize: '0.62rem',
                          color: 'arc.onPaper',
                          textTransform: 'none' }}>
                Use default
            </Button>

            <Popover open={mixing !== null}
                     anchorEl={mixing}
                     onClose={() => setMixing(null)}
                     anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                     transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                     slotProps={{ paper: { className: 'card-stock',
                                           'aria-label': `Mix a ${label.toLowerCase()}`,
                                           sx: { p: 1,
                                                 width: 232,
                                                 display: 'flex',
                                                 flexDirection: 'column',
                                                 gap: 0.75,
                                                 // react-colorful draws its own rounded field and
                                                 // slider; these bring the corners and the pointer
                                                 // in line with the card they sit on.
                                                 '& .react-colorful': { width: '100%', height: '9rem' },
                                                 '& .react-colorful__saturation': { borderRadius: '3px 3px 0 0' },
                                                 '& .react-colorful__last-control': { borderRadius: '0 0 3px 3px' },
                                                 '& .react-colorful__pointer': { width: 18, height: 18 } } } }}>
                <HexColorPicker color={shown} onChange={onChange} />

                <Box component="label"
                     sx={{ display: 'flex',
                           alignItems: 'center',
                           gap: 0.5,
                           fontSize: '0.65rem',
                           color: 'arc.onPaperMuted',
                           '& input': { flex: 1,
                                        minWidth: 0,
                                        font: 'inherit',
                                        fontFamily: 'ui-monospace, monospace',
                                        fontSize: '0.72rem',
                                        color: 'arc.onPaperStrong',
                                        padding: '3px 6px',
                                        border: 'none',
                                        borderRadius: '2px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.6)' } }}>
                    Hex
                    <HexColorInput color={shown} onChange={onChange} prefixed />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button size="small"
                            onClick={() => keep([...saved, shown].slice(-MAX_SAVED))}
                            disabled={onPaper || saved.includes(shown)}
                            sx={{ fontSize: '0.62rem', color: 'arc.paperAccent', textTransform: 'none' }}>
                        Save to yours
                    </Button>
                    <Button size="small"
                            onClick={() => setMixing(null)}
                            sx={{ fontSize: '0.62rem', color: 'arc.onPaper', textTransform: 'none' }}>
                        Done
                    </Button>
                </Box>
            </Popover>
        </Box>
    )
}

export default ArcColourPicker

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** Every ladder's ground, then every ladder's mid: the pale row first, as in the palette. */
const PAPER = (['ground', 'mid'] as const).flatMap(step =>
    Object.entries(LADDERS).map(([hue, ladder]) => ({
        colour: ladder[step],
        name: `${hue[0].toUpperCase()}${hue.slice(1)} ${step === 'mid' && hue === 'yellow' ? 'gold' : step}`,
    })))

/** Where saved colours are kept, and how many. */
const SAVED_KEY = 'arc.savedColours'
const MAX_SAVED = 12

/**
 * The saved colours, or none. Storage can be missing, blocked or full, and a
 * picker that threw for it would take the dialog with it; without it, the
 * colours last as long as the dialog does.
 */
function readSaved(): string[] {
    try {
        const list: unknown = JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]')
        return Array.isArray(list)
            ? list.filter((colour): colour is string => typeof colour === 'string' && /^#[0-9a-f]{6}$/i.test(colour)).slice(-MAX_SAVED)
            : []
    } catch {
        return []
    }
}

function writeSaved(colours: string[]) {
    try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(colours))
    } catch {
        // Not kept past this dialog — see readSaved.
    }
}

const ROW_LABEL_WIDTH = 40

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <Box role="group" aria-label={`${label} colours`} sx={{ display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 0.75 }}>
            <Typography aria-hidden
                        sx={{ width: ROW_LABEL_WIDTH,
                              flexShrink: 0,
                              fontSize: '0.56rem',
                              fontWeight: 700,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              color: 'arc.onPaperMuted' }}>
                {label}
            </Typography>
            <Box sx={{ display: 'flex',
                       flexWrap: 'wrap',
                       alignItems: 'center',
                       gap: 0.75,
                       py: 0.5 }}>{children}</Box>
        </Box>
    )
}

const CHIP_HEIGHT = 20

/** A few degrees either way, in turn, so a row of chips reads as laid down by hand. */
const TILTS = [-2.5, 1.5, -1, 2.5, -1.5, 1]

/**
 * One colour as a chip of card, cut and laid on the panel — the chosen one
 * lifted off it, straightened, and ticked. A saved colour has a small × that
 * shows when the chip is pointed at or has focus.
 */
function Chip({ colour, name, tilt, chosen, onPick, onRemove }: {
    colour: string
    name: string
    tilt: number
    chosen: boolean
    onPick: () => void
    onRemove?: () => void
}) {
    return (
        <Box sx={{ position: 'relative',
                   '&:hover .chip-remove, &:focus-within .chip-remove': { opacity: 1 } }}>
            <Box component="button"
                 type="button"
                 className="card-stock-flat card-cut"
                 onClick={onPick}
                 aria-label={name}
                 aria-pressed={chosen}
                 title={name}
                 sx={{ '--arc-paper': colour,
                       width: 26,
                       height: CHIP_HEIGHT,
                       p: 0,
                       border: 'none',
                       cursor: 'pointer',
                       display: 'grid',
                       placeItems: 'center',
                       transform: chosen ? 'translateY(-3px)' : `rotate(${TILTS[tilt % TILTS.length]}deg)`,
                       transition: 'transform .12s',
                       '&:hover': { transform: chosen ? 'translateY(-3px)' : 'translateY(-1px)' },
                       '&:focus-visible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 2 } }}>
                {chosen && <CheckIcon sx={{ fontSize: '0.85rem',
                                            color: isLight(colour) ? '#22262c' : 'var(--arc-cream)' }} />}
            </Box>

            {onRemove && (
                <IconButton className="chip-remove"
                            onClick={onRemove}
                            aria-label={`Remove ${name}`}
                            sx={{ position: 'absolute',
                                  top: -7,
                                  right: -7,
                                  width: 14,
                                  height: 14,
                                  p: 0,
                                  opacity: 0,
                                  backgroundColor: 'var(--arc-cream)',
                                  boxShadow: '0 1px 2px rgba(38, 28, 10, .35)',
                                  color: 'arc.onPaperMuted',
                                  '&:hover': { backgroundColor: 'var(--arc-cream)', color: 'arc.paperDanger' },
                                  '&:focus-visible': { opacity: 1 } }}>
                    <CloseIcon sx={{ fontSize: '0.6rem' }} />
                </IconButton>
            )}
        </Box>
    )
}

/** Whether dark text reads on a colour — its relative luminance, roughly. */
function isLight(colour: string): boolean {
    const [r, g, b] = rgbOf(colour)
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.55
}

/**
 * DayBand
 *
 * The top of an opened day: its number, its theme's picture, its name, and its
 * tags.
 *
 *   ┌────┐  Tuesday                          ┌────────────┐┌──────────┐
 *   │ 30 │  30 September 2026                │  picture   ││ tags     │
 *   └────┘  Work · progress is tracked       └────────────┘└──────────┘
 *
 * Mirrors: the header row of UpdateDateOverlay.razor — the date in large type,
 * the date-type selector, the palette swatch, and "Tag Canvas Placeholder :)".
 * The selector and the swatch are one thing here: the picture is the type, and
 * clicking it is how the type is changed. The tags are the card editor's tags
 * panel, set beside the picture the way it sits beside a card's title.
 */

import React, { useState } from 'react'
import { Box, ButtonBase, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import { NUMERALS } from '../../Styles/Fonts'
import { rem } from '../../Styles/Measures'
import { TagsPanel } from '../Board/Card/TagsPanel'
import { DayArt } from './DayArt'
import { DAY_TYPES, NO_DAY_TYPE, dayTypeOf } from './Calendar.DayTypes'
import { useCalendarActions } from './Calendar.Context'
import { useCalendarStore } from './Calendar.Store'
import type { GridDay } from './Calendar.Grid'

interface DayBandProps {
    day: GridDay
}

export const DayBand: React.FC<DayBandProps> = ({ day }) => {
    const { setDayType } = useCalendarActions()
    const tags = useCalendarStore(state => state.dayTags[day.key]) ?? NO_TAGS
    const setDayTags = useCalendarStore(state => state.setDayTags)
    const [anchor, setAnchor] = useState<HTMLElement | null>(null)
    const type = dayTypeOf(day.stored?.typeId)

    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: 1.5 }}>
            {/* The number, on the disc it has on the grid, at full size. */}
            <Box className={`card-disc card-stock${day.isToday ? ' paper-oxblood' : ''}`}
                 aria-hidden
                 sx={{ width: DISC,
                       height: DISC,
                       flexShrink: 0,
                       alignSelf: 'center',
                       display: 'grid',
                       placeItems: 'center' }}>
                <Typography component="span"
                            className="gold-foil"
                            sx={{ fontFamily: NUMERALS, fontWeight: 700, fontSize: '2.3rem', lineHeight: 1 }}>
                    {day.date.date()}
                </Typography>
            </Box>

            {/* The date in words, and what kind of day it is. */}
            <Box sx={{ flex: '1 1 12rem',
                       minWidth: 0,
                       display: 'flex',
                       flexDirection: 'column',
                       justifyContent: 'center' }}>
                {/* One heading for both lines, so the dialog is named by the whole date. */}
                <Box component="h2" sx={{ m: 0,
                                          color: 'arc.onGlass',
                                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.35)' }}>
                    <Box component="span"
                         sx={{ display: 'block',
                               fontFamily: "Georgia, 'Times New Roman', serif",
                               fontSize: '1.6rem',
                               fontWeight: 400,
                               lineHeight: 1.1 }}>
                        {day.date.format('dddd')}
                    </Box>
                    <Box component="span" sx={{ display: 'block', fontSize: '0.9rem', fontWeight: 400 }}>
                        {day.date.format('D MMMM YYYY')}{day.isToday ? ' · Today' : ''}
                    </Box>
                </Box>
                <Typography sx={{ mt: 0.5,
                                  fontSize: '0.76rem',
                                  color: 'arc.onGlass',
                                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.35)' }}>
                    {type.id === NO_DAY_TYPE.id ? 'No theme yet — choose one from the picture.' : `${type.name} · ${type.blurb}`}
                </Typography>
            </Box>

            {/*
                The picture is the button: what kind of day it is, and where to
                change that. With no theme yet it is a blank card that says so.
            */}
            <ButtonBase className="card-stock tile"
                        onClick={event => setAnchor(event.currentTarget)}
                        aria-haspopup="menu"
                        aria-label={`Theme: ${type.name}. Change the theme`}
                        sx={{ width: ART_WIDTH,
                              height: ART_HEIGHT,
                              flexShrink: 0,
                              overflow: 'hidden',
                              position: 'relative',
                              '&:hover .change': { opacity: 1 },
                              '&.Mui-focusVisible .change': { opacity: 1 },
                              '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 2 } }}>
                {type.scene
                    ? <DayArt scene={type.scene} />
                    : (
                        <Typography sx={{ fontSize: '0.78rem',
                                          color: 'arc.onPaperMuted',
                                          px: 2,
                                          textAlign: 'center' }}>
                            Choose a theme
                        </Typography>
                    )}
                {type.scene && (
                    <Box className="change"
                         aria-hidden
                         sx={{ position: 'absolute',
                               right: 4,
                               bottom: 4,
                               px: 0.6,
                               borderRadius: '1px',
                               backgroundColor: 'rgba(246, 241, 228, 0.9)',
                               fontSize: '0.62rem',
                               fontWeight: 600,
                               color: 'arc.onPaperStrong',
                               opacity: 0,
                               transition: 'opacity 120ms' }}>
                        Change
                    </Box>
                )}
            </ButtonBase>

            <Menu anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
                {[...DAY_TYPES, NO_DAY_TYPE].map(option => (
                    <MenuItem key={option.id}
                              role="menuitemradio"
                              aria-checked={option.id === type.id}
                              onClick={() => {
                                  setAnchor(null)
                                  if (option.id !== type.id) setDayType(day, option.id)
                              }}
                              sx={{ gap: 1.5, py: 0.75 }}>
                        <ListItemIcon>
                            <Box className="card-stock-flat" sx={{ width: 72,
                                                                   height: 40,
                                                                   overflow: 'hidden',
                                                                   borderRadius: '1px' }}>
                                {option.scene && <DayArt scene={option.scene} />}
                            </Box>
                        </ListItemIcon>
                        <ListItemText primary={option.name}
                                      secondary={option.blurb}
                                      primaryTypographyProps={{ sx: { fontSize: '0.86rem', fontWeight: 600 } }}
                                      secondaryTypographyProps={{ sx: { fontSize: '0.72rem', maxWidth: rem(230), whiteSpace: 'normal' } }} />
                        <CheckIcon aria-hidden
                                   sx={{ fontSize: '1rem',
                                         visibility: option.id === type.id ? 'visible' : 'hidden' }} />
                    </MenuItem>
                ))}
            </Menu>

            <Box sx={{ display: 'flex', flex: '1 1 8rem', maxWidth: TAGS_WIDTH, height: ART_HEIGHT }}>
                <TagsPanel tags={tags}
                           onChange={next => setDayTags(day.key, next)}
                           unsavedNote="The API has no tags on a date yet, so these last only until the page is reloaded. See docs/api-gaps.md, #8." />
            </Box>
        </Box>
    )
}

export default DayBand

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** One empty list for every day without tags, so the store's selector is stable. */
const NO_TAGS: never[] = []

const DISC = 76

/** 2:1, the shape the scenes are drawn in, so this one is not cropped. */
const ART_WIDTH = 168
const ART_HEIGHT = 84

const TAGS_WIDTH = rem(200)

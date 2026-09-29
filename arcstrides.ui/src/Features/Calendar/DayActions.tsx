/**
 * DayActions
 *
 * The quick-actions tile on each day, and its menu.
 *
 * Mirrors: the vertical-dots icon on each Blazor date (icons8-menu-vertical),
 * which had no handler — the actions it would hold were never settled. The list
 * is data, the way BoardManagementNav's menus are: a new quick action is a line
 * in ACTIONS.
 *
 *   Add a card…                    opens the day with the search open
 *   Carry 2 unfinished cards to …  moves them to the next working day
 *   Theme: Work / Leisure / …      what kind of day it is, with its picture
 *   Open this day                  (not in the day's own overlay)
 *
 * Carrying over is the chore a calendar of tasks makes every evening; the
 * target is worked out from the days' types, so it steps over a weekend marked
 * Leisure or the rest of a vacation — see Calendar.Moves.
 *
 * The whole tile is the button, so its hit area is the piece of card you can
 * see rather than the glyph in the middle of it.
 */

import React, { useState } from 'react'
import { Box, ButtonBase, Divider, ListItemIcon, ListItemText, ListSubheader, Menu, MenuItem } from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import CheckIcon from '@mui/icons-material/Check'
import { DayArt } from './DayArt'
import { DAY_TYPES, NO_DAY_TYPE, dayTypeOf } from './Calendar.DayTypes'
import { unfinished } from './Calendar.Moves'
import { useCalendarActions, type CalendarActions } from './Calendar.Context'
import type { GridDay } from './Calendar.Grid'

interface DayActionsProps {
    day: GridDay
    /** In the day's own overlay: leave out anything that would open the day. */
    mini?: boolean
}

export const DayActions: React.FC<DayActionsProps> = ({ day, mini = false }) => {
    const actions = useCalendarActions()
    const [anchor, setAnchor] = useState<HTMLElement | null>(null)
    const available = ACTIONS.filter(action => !(mini && action.opensDay) && (action.shows?.(day) ?? true))
    const current = dayTypeOf(day.stored?.typeId)
    const run = (then: () => void) => {
        setAnchor(null)
        then()
    }

    return (
        <>
            <ButtonBase onClick={event => setAnchor(event.currentTarget)}
                        aria-label={`Quick actions for ${day.date.format('dddd D MMMM')}`}
                        aria-haspopup="menu"
                        sx={{ flex: 1,
                              minWidth: '1.2rem',
                              borderRadius: '1px',
                              color: 'arc.onPaper',
                              '&:hover': { backgroundColor: 'arc.paperHover', color: 'arc.onPaperStrong' },
                              '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 } }}>
                <MoreVertIcon sx={{ fontSize: '0.95rem' }} />
            </ButtonBase>

            <Menu anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
                {available.filter(action => !action.last).map(action => (
                    <MenuItem key={action.key} dense onClick={() => run(() => action.run(actions, day))}>
                        {action.label(actions, day)}
                    </MenuItem>
                ))}

                <Divider />
                <ListSubheader sx={{ lineHeight: 2.2,
                                     fontSize: '0.68rem',
                                     letterSpacing: '0.06em',
                                     textTransform: 'uppercase' }}>
                    Theme
                </ListSubheader>

                {/*
                    One of these is always the day's; a radio group in all but
                    name, so each says whether it is the chosen one.
                */}
                {[...DAY_TYPES, NO_DAY_TYPE].map(type => (
                    <MenuItem key={type.id}
                              dense
                              role="menuitemradio"
                              aria-checked={type.id === current.id}
                              onClick={() => run(() => {
                                  if (type.id !== current.id) actions.setDayType(day, type.id)
                              })}>
                        <ListItemIcon>
                            <Box className="card-stock-flat"
                                 sx={{ width: 30, height: 18, overflow: 'hidden', borderRadius: '1px' }}>
                                {type.scene && <DayArt scene={type.scene} />}
                            </Box>
                        </ListItemIcon>
                        <ListItemText primary={type.name} primaryTypographyProps={{ sx: { fontSize: '0.82rem' } }} />
                        <CheckIcon aria-hidden
                                   sx={{ ml: 1.5,
                                         fontSize: '0.9rem',
                                         visibility: type.id === current.id ? 'visible' : 'hidden' }} />
                    </MenuItem>
                ))}

                {available.some(action => action.last) && <Divider />}
                {available.filter(action => action.last).map(action => (
                    <MenuItem key={action.key} dense onClick={() => run(() => action.run(actions, day))}>
                        {action.label(actions, day)}
                    </MenuItem>
                ))}
            </Menu>
        </>
    )
}

export default DayActions

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

interface DayAction {
    key: string
    label: (actions: CalendarActions, day: GridDay) => string
    run: (actions: CalendarActions, day: GridDay) => void
    /** Leave the action out on days it would do nothing for. */
    shows?: (day: GridDay) => boolean
    /** Opens the day's overlay — pointless from inside it. */
    opensDay?: boolean
    /** Under the themes, at the foot of the menu, rather than above them. */
    last?: boolean
}

const ACTIONS: DayAction[] = [
    {
        key: 'add',
        label: () => 'Add a card…',
        run: (actions, day) => actions.openDay(day, { adding: true }),
    },
    {
        key: 'carry',
        label: (actions, day) => {
            const count = unfinished(day.stored?.cards ?? []).length
            return `Carry ${count} unfinished ${count === 1 ? 'card' : 'cards'} to ${actions.carryTarget(day).format('ddd D MMM')}`
        },
        run: (actions, day) => actions.carryOver(day),
        shows: day => unfinished(day.stored?.cards ?? []).length > 0,
    },
    {
        key: 'open',
        label: () => 'Open this day',
        run: (actions, day) => actions.openDay(day),
        opensDay: true,
        last: true,
    },
]

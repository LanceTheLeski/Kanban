/**
 * DayActionsMenu
 *
 * The quick-actions tile on each day, and its menu.
 *
 * Mirrors: the vertical-dots icon on each Blazor date (icons8-menu-vertical),
 * which had no handler — the actions it would hold were never settled. The list
 * is data, the way BoardNavBar's menus are: a new quick action is a line
 * in ACTIONS.
 *
 *   Add a card…                    opens the day with the search open
 *   Theme: Work / Leisure / …      what kind of day it is, with its picture
 *   Open this day                  (not in the day's own overlay)
 *
 * The whole tile is the button, so its hit area is the piece of card you can
 * see rather than the glyph in the middle of it.
 */

import React, { useState } from 'react'
import { Box, ButtonBase, Divider, ListItemIcon, ListItemText, ListSubheader, Menu, MenuItem } from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import CheckIcon from '@mui/icons-material/Check'
import { DayTypeSceneArt } from '../Assets/DayTypeSceneArt'
import { useDayTypes } from '../Hooks/useDayTypes'
import { useCalendarActions, type CalendarActions } from '../Calendar.Context'
import type { GridDay } from '../Calendar.Grid'

interface DayActionsMenuProps
{
    day: GridDay
    /** In the day's own overlay: leave out anything that would open the day. */
    mini?: boolean
}

export const DayActionsMenu: React.FC<DayActionsMenuProps> = ({ day, mini = false }) =>
{
    const actions = useCalendarActions()
    const [anchor, setAnchor] = useState<HTMLElement | null>(null)
    const available = ACTIONS.filter(action => !(mini && action.opensDay) && (action.shows?.(day) ?? true))
    const { choicesFor } = useDayTypes()
    // What was chosen for the day itself: 0 when it follows the week.
    const chosen = day.stored?.typeId ?? 0
    const run = (then: () => void) =>
    {
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
                              '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 }
                           }}>
                <MoreVertIcon sx={{ fontSize: '0.95rem' }} />
            </ButtonBase>

            <Menu anchorEl={anchor}
                  open={anchor !== null}
                  onClose={() => setAnchor(null)}>
                { available.filter(action => !action.last)
                           .map(action =>
                                (
                                    <MenuItem key={action.key}
                                              dense
                                              onClick={() => run(() => action.run(actions, day))}>
                                        { action.label(actions, day) }
                                    </MenuItem>
                                ))
                }

                <Divider />
                <ListSubheader sx={{ lineHeight: 2.2,
                                     fontSize: '0.68rem',
                                     letterSpacing: '0.06em',
                                     textTransform: 'uppercase'
                                  }}>
                    Theme
                </ListSubheader>

                {/*
                    One of these is always the day's; a radio group in all but
                    name, so each says whether it is the chosen one.
                */}
                { choicesFor(day.date).map(choice =>
                                           (
                                               <MenuItem key={choice.id}
                                                         dense
                                                         role="menuitemradio"
                                                         aria-checked={choice.id === chosen}
                                                         onClick={() => run(() =>
                                                         {
                                                             if (choice.id !== chosen)
                                                                 actions.setDayType(day, choice.id)
                                                         })}>
                                                   <ListItemIcon>
                                                       <Box className="card-stock-flat"
                                                            sx={{ width: 30,
                                                                  height: 18,
                                                                  overflow: 'hidden',
                                                                  borderRadius: '1px'
                                                               }}>
                                                           { choice.type.scene && <DayTypeSceneArt scene={choice.type.scene} /> }
                                                       </Box>
                                                   </ListItemIcon>
                                                   <ListItemText primary={choice.name}
                                                                 primaryTypographyProps={{ sx: { fontSize: '0.82rem' } }} />
                                                   <CheckIcon aria-hidden
                                                              sx={{ ml: 1.5,
                                                                    fontSize: '0.9rem',
                                                                    visibility: choice.id === chosen
                                                                        ? 'visible'
                                                                        : 'hidden'
                                                                 }} />
                                               </MenuItem>
                                           ))
                }

                { available.some(action => action.last) && <Divider /> }
                { available.filter(action => action.last)
                           .map(action =>
                                (
                                    <MenuItem key={action.key}
                                              dense
                                              onClick={() => run(() => action.run(actions, day))}>
                                        { action.label(actions, day) }
                                    </MenuItem>
                                ))
                }
            </Menu>
        </>
    )
}

export default DayActionsMenu

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

interface DayAction
{
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

const ACTIONS: DayAction[] =
[
    {
        key: 'add',
        label: () => 'Add a card…',
        run: (actions, day) => actions.openDay(day, { adding: true }),
    },
    {
        key: 'open',
        label: () => 'Open this day',
        run: (actions, day) => actions.openDay(day),
        opensDay: true,
        last: true,
    },
]
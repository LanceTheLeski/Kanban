/**
 * DayActions
 *
 * The quick-actions tile on each day, and its menu.
 *
 * Mirrors: the vertical-dots icon on each Blazor date (icons8-menu-vertical),
 * which had no handler — the actions it would hold were never settled. So it
 * opens with the two things a day can already do, and the list is data, the
 * way BoardManagementNav's menus are: a new quick action is a line in ACTIONS.
 *
 * The whole tile is the button, so its hit area is the piece of card you can
 * see rather than the glyph in the middle of it.
 */

import React, { useState } from 'react'
import { ButtonBase, Menu, MenuItem } from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
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
    const available = ACTIONS.filter(action => !(mini && action.opensDay))

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
                {available.map(action => (
                    <MenuItem key={action.label}
                              dense
                              onClick={() => {
                                  setAnchor(null)
                                  action.run(actions, day)
                              }}>
                        {action.label}
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
    label: string
    run: (actions: CalendarActions, day: GridDay) => void
    /** Opens the day's overlay — pointless from inside it. */
    opensDay?: boolean
}

const ACTIONS: DayAction[] = [
    { label: 'Add a card…', run: (actions, day) => actions.openDay(day, { adding: true }) },
    { label: 'Open this day', run: (actions, day) => actions.openDay(day), opensDay: true },
]

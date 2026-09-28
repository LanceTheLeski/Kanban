/**
 * DayActions
 *
 * The quick-actions button on each day, and its menu.
 *
 * Mirrors: the vertical-dots icon on each Blazor date (icons8-menu-vertical),
 * which had no handler — the actions it would hold were never settled. So it
 * opens with the two things a day can already do, and the list is data, the
 * way BoardManagementNav's menus are: a new quick action is a line in ACTIONS.
 */

import React, { useState } from 'react'
import { IconButton, Menu, MenuItem } from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { useCalendarActions, type CalendarActions } from './Calendar.Context'
import type { GridDay } from './Calendar.Grid'

interface DayActionsProps {
    day: GridDay
}

export const DayActions: React.FC<DayActionsProps> = ({ day }) => {
    const actions = useCalendarActions()
    const [anchor, setAnchor] = useState<HTMLElement | null>(null)

    return (
        <>
            <IconButton size="small"
                        onClick={event => setAnchor(event.currentTarget)}
                        aria-label={`Quick actions for ${day.date.format('dddd D MMMM')}`}
                        aria-haspopup="menu"
                        sx={{ p: 0.15,
                              flexShrink: 0,
                              borderRadius: '2px',
                              color: 'arc.onPaperMuted',
                              '&:hover': { color: 'arc.onPaperStrong', backgroundColor: 'arc.paperHover' } }}>
                <MoreVertIcon sx={{ fontSize: '1rem' }} />
            </IconButton>

            <Menu anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
                {ACTIONS.map(action => (
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
}

const ACTIONS: DayAction[] = [
    { label: 'Add a card…', run: (actions, day) => actions.openDay(day, { adding: true }) },
    { label: 'Open this day', run: (actions, day) => actions.openDay(day) },
]

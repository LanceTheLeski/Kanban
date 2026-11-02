/**
 * DayCardsPanel
 *
 * The cards on an opened day, in one list: every card put on the day, and every
 * card due on it, each once, with what of it falls on the day.
 *
 *   ┌ Cards ─────────────────────────────────────────┐
 *   │ Migrate auth service              [09:30]  1/2  │
 *   │ 1 task due                                      │
 *   │   ● Cut over          Deadline · 09:30–11:30    │
 *   │ Calendar page                      [Due]        │  ×
 *   │ Put on this day · due — its own dates           │
 *   │ The card's deadline · no time                   │
 *   │ + Add card                                      │
 *   └─────────────────────────────────────────────────┘
 *
 * It replaces two columns, Due and Cards, which listed a task's deadline on its
 * own on the left and the cards put on the day on the right — so a task due on
 * the day appeared without the card it belongs to, and a card due on the day
 * did not appear among the day's cards at all. A task is always under its card
 * now (Calendar.Stops, cardsOnDay), and the note says why the card is on the
 * day: put on it, due on it by dates of its own, or due by a task.
 *
 * The × beside a card takes it off the day, and is only beside a card that was
 * put on the day: one that is only due is there because of its dates, which
 * are changed on the card.
 *
 * A preview of the day (DayPreviewOverlay) draws it read-only, with the points
 * being edited — not saved yet — on a piece of blue at the top.
 */

import React from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { ArcTitleBar } from '../../../Components/ArcTitleBar'
import { DayCardNote } from '../GridDay/DayCardNote'
import { durationLabel, spanLabel } from '../../Board/Timeline/Timeline.Nodes'
import type { DayCardEntry, PendingPoint } from '../Calendar.Stops'
import type { Card } from '../../../Entities/Card/Card.Types'

interface DayCardsPanelProps
{
    entries: DayCardEntry[]

    /** What to say with no card on the day — the day type's own note. */
    emptyNote: string

    /** What to say above the cards on a day that does not expect work. */
    busyNote?: string

    /** While the boards are first read, and some cards due on the day may not be in yet. */
    reading?: boolean

    /** Names a card's board, on a day holding cards from more than one. */
    boardCaptionOf?: (card: Card) => string | undefined

    /** Takes a card put on the day off it. Absent in a preview. */
    onRemoveCard?: (card: Card) => void

    /** Points as they stand in an editor, not saved yet: a preview's. */
    pending?: PendingPoint[]

    /** A preview: nothing opens or changes. */
    readOnly?: boolean

    /** What goes under the list: "+ Add card", on the day overlay. */
    children?: React.ReactNode
}

export const DayCardsPanel: React.FC<DayCardsPanelProps> = ({
    entries,
    emptyNote,
    busyNote,
    reading = false,
    boardCaptionOf,
    onRemoveCard,
    pending = [],
    readOnly = false,
    children,
}) => (
    <Box role="region"
         aria-label="Cards on this day"
         sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <ArcTitleBar caption="Put on this day, or due on it">Cards</ArcTitleBar>

        { pending.length > 0 && <PendingNote points={pending} /> }

        { entries.length === 0 && pending.length === 0 && (
            <Empty>
                { reading
                    ? 'Reading the boards…'
                    : emptyNote
                }
            </Empty>
        )
        }
        { entries.length > 0 && busyNote && <Empty>{ busyNote }</Empty> }

        {/*
            The × sits beside the card on the panel, not on it: the card's title
            is itself a button, and a button inside a button is two targets that
            cannot tell which was meant.
        */}
        { entries.map(entry =>
                      (
                          <Box key={entry.card.id}
                               sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                              <DayCardNote card={entry.card}
                                           tasks={entry.tasks}
                                           entry={entry}
                                           size="medium"
                                           readOnly={readOnly}
                                           boardCaption={boardCaptionOf?.(entry.card)} />
                              { onRemoveCard && entry.placed && (
                                  <IconButton size="small"
                                              onClick={() => onRemoveCard(entry.card)}
                                              aria-label={`Take ${entry.card.title} off this day`}
                                              sx={{ flexShrink: 0,
                                                    color: 'arc.onPaperMuted',
                                                    '&:hover': { color: 'arc.paperDanger', backgroundColor: 'arc.paperHover' }
                                                 }}>
                                      <CloseIcon sx={{ fontSize: '0.95rem' }} />
                                  </IconButton>
                              )
                              }
                          </Box>
                      ))
        }

        { children }
    </Box>
)

export default DayCardsPanel

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** The points being edited, as they stand: what is being scheduled, and when. */
function PendingNote({ points }: { points: PendingPoint[] })
{
    return (
        <Box className="card-stock paper-blue"
             role="group"
             aria-label={`${points[0].title}, as in the editor, not saved yet`}
             sx={{ px: 1, py: 0.75, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'arc.onPaperStrong' }}>
                { points[0].title }
            </Typography>
            <Typography sx={{ fontSize: '0.62rem', color: 'arc.onPaperMuted' }}>
                As in the editor, not saved yet
            </Typography>
            { points.map(point =>
                         (
                             <Typography key={point.key}
                                         sx={{ fontSize: '0.68rem', color: 'arc.onPaperStrong' }}>
                                 { point.name } · { point.timed
                                     ? spanLabel(point.at, point.duration, point.relative)
                                     : `no time${point.duration
                                         ? ` · ${durationLabel(point.duration)}`
                                         : ''}`
                                                  }
                             </Typography>
                         ))
            }
        </Box>
    )
}

function Empty({ children }: { children: React.ReactNode })
{
    return (
        <Typography sx={{ fontSize: '0.75rem', color: 'arc.onPaperMuted', px: 0.5 }}>
            { children }
        </Typography>
    )
}

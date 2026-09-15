/**
 * CommandPanel
 *
 * The card's history, and the line you type into to change it.
 *
 * Mirrors: Commands/CommandPanel.razor — which was a structural stub, three
 * <Typography>Text 1..3</Typography> placeholders and a disabled input.
 *
 * ── What it is meant to be ───────────────────────────────────────────────────
 * A cross between a chat window and a game's event log: mostly system messages
 * narrating the card's history, with the occasional line a person wrote, and
 * commands typed into the same stream so a quick change and the record of it
 * are the same thing.
 *
 * Three decisions make that readable rather than a wall of text:
 *
 *   1. Every entry is the same shape — time, kind, one line — so the eye can run
 *      down the left edge and sort them without reading. The coloured rule is
 *      what distinguishes a system event from something a person wrote.
 *   2. Entity names are pills, not words in a sentence. "Moved to In Progress"
 *      reads as prose; `moved to [In Progress]` reads as a record. Pills are
 *      also the hook for making these clickable once there is anywhere to go.
 *   3. Timestamps are monospace and dim. They must align to be scannable, and
 *      they must not compete with the content for attention.
 *
 * ── Status: this is a prototype, and it says so on screen ────────────────────
 * There is no history API. Nothing on the server records that a card moved, and
 * CardResponse carries no log, so the entries below are derived from what the
 * card *currently* is — its tasks, where it sits, what it is called — and
 * presented as the history that would have produced it.
 *
 * That is stated in the panel itself rather than only here. A prototype that
 * looks functional is how this project already lost a day: CreateTaskTypeOverlay
 * shipped as a stub that logged to the console and reported success, and the two
 * bugs that caused pointed anywhere but at it. A panel showing invented history
 * as though it were real would be the same mistake with a longer fuse.
 *
 * What it needs to become real:
 *   - an append-only CardEvent table keyed by card, written by the controllers
 *     that already mutate cards, positions, tasks and timelines
 *   - GET /arcstrides/boards/{boardID}/cards/{cardID}/events
 *   - POST for a note, and for a command once there is a command grammar
 */

import React, { useMemo, useRef, useState } from 'react'
import { Box, IconButton, InputBase, Paper, Tooltip, Typography } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import {
    COMMAND_LOG_MIN_HEIGHT,
    COMMAND_PANEL_MIN_WIDTH,
} from '../../../Styles/Measures'
import { entity, text, type CardLogEntry, type CardLogKind, type CardLogSpan } from './CardLog.Types'
import type { Card } from '../../../Entities/Card/Card.Types'

// ── Presentation per kind ─────────────────────────────────────────────────────

/**
 * The sigil is what the kind looks like when the colour is not available —
 * a colour-blind reader, a screenshot in grayscale, a very dim monitor. Colour
 * alone should never be the only carrier of a distinction.
 */
const KIND: Record<CardLogKind, { colour: string; sigil: string; label: string }> = {
    event: { colour: 'arc.logEvent', sigil: '•', label: 'Event' },
    note: { colour: 'arc.logNote', sigil: '"', label: 'Note' },
    command: { colour: 'arc.logCommand', sigil: '>', label: 'Command' },
    result: { colour: 'arc.logResult', sigil: '=', label: 'Result' },
    alert: { colour: 'arc.logAlert', sigil: '!', label: 'Alert' },
}

const clockFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })
const dayFormat = new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short' })

// ── Sample history ────────────────────────────────────────────────────────────

/**
 * A plausible history for a card that has no recorded one.
 *
 * Derived from the card rather than hardcoded, so the panel demonstrates what
 * real entries would look like with real names in them — a card with four tasks
 * and a long title shows the wrapping and pill behaviour that a lorem-ipsum
 * sample would hide.
 */
function sampleHistory(card: Card): CardLogEntry[] {
    const now = Date.now()
    const ago = (minutes: number) => new Date(now - minutes * 60_000)

    const entries: CardLogEntry[] = [
        {
            id: 'created',
            kind: 'event',
            at: ago(60 * 26),
            actor: 'Lance',
            content: [text('created this card in'), entity(card.columnName, 'column')],
        },
        {
            id: 'placed',
            kind: 'event',
            at: ago(60 * 26),
            content: [text('placed on swimlane'), entity(card.swimlaneName, 'swimlane')],
        },
    ]

    card.tasks.slice(0, 3).forEach((task, index) => {
        entries.push({
            id: `task-${task.id || index}`,
            kind: 'event',
            at: ago(60 * 20 - index * 90),
            actor: 'Lance',
            content: [
                text(task.isCompleted ? 'completed task' : 'added task'),
                entity(task.title, 'task'),
            ],
        })
    })

    entries.push(
        {
            id: 'note',
            kind: 'note',
            at: ago(95),
            actor: 'Lance',
            content: [text('Blocked until the storage key is rotated — not starting this yet.')],
        },
        {
            id: 'command',
            kind: 'command',
            at: ago(30),
            actor: 'Lance',
            content: [text('/move "In Progress"')],
        },
        {
            id: 'result',
            kind: 'result',
            at: ago(30),
            content: [text('moved to'), entity('In Progress', 'column')],
        },
    )

    if (!card.timeline)
        entries.push({
            id: 'alert',
            kind: 'alert',
            at: ago(8),
            content: [text('no deadline set — this card will not appear on the calendar')],
        })

    return entries.sort((a, b) => a.at.getTime() - b.at.getTime())
}

// ── Entry ─────────────────────────────────────────────────────────────────────

const Span: React.FC<{ span: CardLogSpan }> = ({ span }) => {
    if ('text' in span) return <>{span.text} </>

    return (
        <>
            <Box
                component="span"
                sx={{
                    display: 'inline-block',
                    px: 0.6,
                    borderRadius: 0.75,
                    backgroundColor: 'arc.glassSelected',
                    color: 'arc.onGlassStrong',
                    fontWeight: 600,
                    // A name can be long and is not breakable mid-word by choice;
                    // let it wrap at the pill rather than push the panel wider.
                    overflowWrap: 'anywhere',
                }}
            >
                {span.entity}
            </Box>{' '}
        </>
    )
}

const LogEntry: React.FC<{ entry: CardLogEntry; showDay: boolean }> = ({ entry, showDay }) => {
    const kind = KIND[entry.kind]

    return (
        <Box
            sx={{
                display: 'grid',
                // Time, sigil, content. Fixed first two tracks so every row's
                // content starts on the same x — that alignment is most of what
                // makes a log scannable.
                gridTemplateColumns: 'auto auto minmax(0, 1fr)',
                gap: 0.75,
                alignItems: 'baseline',
                py: 0.4,
                pl: 0.75,
                borderLeft: '2px solid',
                borderLeftColor: kind.colour,
                '&:hover': { backgroundColor: 'arc.glassHover' },
            }}
        >
            <Typography
                component="time"
                sx={{
                    fontFamily: '"DM Mono", ui-monospace, monospace',
                    fontSize: '0.68rem',
                    color: 'arc.onGlassMuted',
                    whiteSpace: 'nowrap',
                }}
            >
                {showDay ? dayFormat.format(entry.at) : clockFormat.format(entry.at)}
            </Typography>

            <Tooltip title={kind.label} placement="left">
                <Box
                    component="span"
                    aria-label={kind.label}
                    sx={{
                        fontFamily: '"DM Mono", ui-monospace, monospace',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: kind.colour,
                        width: '1ch',
                        textAlign: 'center',
                    }}
                >
                    {kind.sigil}
                </Box>
            </Tooltip>

            <Typography
                sx={{
                    fontSize: '0.75rem',
                    lineHeight: 1.45,
                    color: entry.kind === 'command' ? 'arc.logCommand' : 'arc.onGlass',
                    fontFamily: entry.kind === 'command'
                        ? '"DM Mono", ui-monospace, monospace'
                        : undefined,
                }}
            >
                {entry.actor && (
                    <Box component="span" sx={{ fontWeight: 700, color: 'arc.onGlassStrong' }}>
                        {entry.actor}{' '}
                    </Box>
                )}
                {entry.content.map((span, index) => <Span key={index} span={span} />)}
            </Typography>
        </Box>
    )
}

// ── Panel ─────────────────────────────────────────────────────────────────────

/** The commands the grammar is being designed around. Shown by `/help`. */
const PLANNED_COMMANDS = [
    '/move "<column>"        move this card',
    '/lane "<swimlane>"      move to a swimlane',
    '/task <title>           add a task',
    '/done <task>            complete a task',
    '/due <date>             set the deadline',
    '/tag <name>             add a tag',
    '/note <text>            leave a note',
]

interface CommandPanelProps {
    /** The card whose history this is. */
    card: Card
}

export const CommandPanel: React.FC<CommandPanelProps> = ({ card }) => {
    const history = useMemo(() => sampleHistory(card), [card])

    // Entries added during this session, on top of the sample. They are not sent
    // anywhere — see the file header.
    const [session, setSession] = useState<CardLogEntry[]>([])
    const [draft, setDraft] = useState('')
    const logRef = useRef<HTMLDivElement | null>(null)

    const entries = [...history, ...session]

    const append = (...added: CardLogEntry[]) => {
        setSession(previous => [...previous, ...added])
        // Scroll after the entries have been laid out.
        requestAnimationFrame(() => {
            if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
        })
    }

    const submit = () => {
        const entered = draft.trim()
        if (!entered) return

        const at = new Date()
        const id = `session-${Date.now()}`
        const isCommand = entered.startsWith('/')

        if (!isCommand) {
            append({ id, kind: 'note', at, actor: 'You', content: [text(entered)] })
            setDraft('')
            return
        }

        append({ id, kind: 'command', at, actor: 'You', content: [text(entered)] })

        const [name] = entered.slice(1).split(/\s+/)
        append({
            id: `${id}-result`,
            // An unimplemented command answers as an alert, not a result. A
            // prototype that returns a cheerful "done!" for work it did not do is
            // the exact failure mode this panel's header warns about.
            kind: name === 'help' ? 'result' : 'alert',
            at,
            content: name === 'help'
                ? [text('Planned commands: ' + PLANNED_COMMANDS.map(c => c.split(' ')[0]).join(', '))]
                : [text(`/${name} is not wired up yet — commands need the card event API.`)],
        })
        setDraft('')
    }

    return (
        <Paper
            className="glass-inner-engraved"
            sx={{
                p: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                minWidth: COMMAND_PANEL_MIN_WIDTH,
                // Fills whatever the row gives it, rather than sizing to content
                // and leaving the panel beside it looking ragged.
                flex: 1,
                minHeight: 0,
                height: '100%',
            }}
        >
            {/* Header, and the honesty about what this is. */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexShrink: 0 }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'arc.onGlassStrong', letterSpacing: '0.06em' }}>
                    CARD LOG
                </Typography>
                <Tooltip title="The server records no card history yet, so these entries are derived from the card's current state to show the shape. Nothing here is saved.">
                    <Typography sx={{ fontSize: '0.62rem', color: 'arc.logAlert', cursor: 'help' }}>
                        sample data
                    </Typography>
                </Tooltip>
            </Box>

            {/* The log */}
            <Box
                ref={logRef}
                sx={{
                    flex: 1,
                    minHeight: COMMAND_LOG_MIN_HEIGHT,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {entries.map((entry, index) => (
                    <LogEntry
                        key={entry.id}
                        entry={entry}
                        // The date is shown only when the day changes, so repeated
                        // entries on one day do not repeat it.
                        showDay={
                            index === 0 ||
                            entries[index - 1].at.toDateString() !== entry.at.toDateString()
                        }
                    />
                ))}
            </Box>

            {/* The command line */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    flexShrink: 0,
                    px: 0.75,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'arc.glassDivider',
                    backgroundColor: 'arc.glassHover',
                    '&:focus-within': { borderColor: 'arc.accentOnGlass' },
                }}
            >
                <Box
                    component="span"
                    sx={{
                        fontFamily: '"DM Mono", ui-monospace, monospace',
                        fontWeight: 700,
                        color: 'arc.accentOnGlass',
                        fontSize: '0.8rem',
                    }}
                >
                    &gt;
                </Box>

                <InputBase
                    value={draft}
                    onChange={event => setDraft(event.target.value)}
                    onKeyDown={event => {
                        if (event.key !== 'Enter') return
                        event.preventDefault()
                        submit()
                    }}
                    placeholder="Message, or /help for commands"
                    sx={{
                        flex: 1,
                        fontSize: '0.75rem',
                        color: 'arc.onGlass',
                        fontFamily: draft.startsWith('/')
                            ? '"DM Mono", ui-monospace, monospace'
                            : undefined,
                        '& input::placeholder': { color: 'arc.onGlassMuted', opacity: 1 },
                    }}
                />

                <IconButton size="small" onClick={submit} disabled={!draft.trim()} aria-label="Send">
                    <SendIcon sx={{ fontSize: '0.9rem', color: draft.trim() ? 'arc.accentOnGlass' : 'arc.onGlassMuted' }} />
                </IconButton>
            </Box>
        </Paper>
    )
}

export default CommandPanel

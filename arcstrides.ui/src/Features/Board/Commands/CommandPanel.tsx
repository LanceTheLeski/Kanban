/**
 * CommandPanel
 *
 * The card's command console.
 *
 * Mirrors: Commands/CommandPanel.razor — which was a structural stub, three
 * <Typography>Text 1..3</Typography> placeholders and a disabled input.
 *
 * ── What it shows ────────────────────────────────────────────────────────────
 * What you have run in this session, and what came back. It starts empty,
 * because nothing has been run yet — which is the honest state and the reason
 * this is no longer a "card log".
 *
 * The log version invented a plausible history for a card and marked it "sample
 * data", because the server records none. A console has no such problem: an
 * empty transcript is correct rather than a placeholder, and every line in it
 * is something that actually happened.
 *
 * Three decisions carry over from the log, because they were about reading a
 * stream of short lines and that has not changed:
 *
 *   1. Every entry is the same shape — time, kind, one line — so the eye can
 *      run down the left edge and sort them without reading.
 *   2. Entity names are pills, not words in a sentence. `moved to [In Progress]`
 *      reads as a record where "Moved to In Progress" reads as prose.
 *   3. Timestamps are monospace and dim: they must align to be scannable, and
 *      must not compete with the content.
 *
 * ── Status ───────────────────────────────────────────────────────────────────
 * The grammar below is designed but not wired. `/help` lists it; anything else
 * answers as an error saying so, rather than a cheerful "done" for work that
 * did not happen. Running a command for real needs the same endpoints the rest
 * of the board already uses, routed through useBoardActions — see the note by
 * PLANNED_COMMANDS.
 */

import React, { useRef, useState } from 'react'
import { Box, IconButton, InputBase, Paper, Tooltip, Typography } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import { COMMAND_PANEL_MIN_WIDTH } from '../../../Styles/Measures'
import { text, type CardCommandEntry, type CardCommandKind, type CardCommandSpan } from './CardCommand.Types'
import type { Card } from '../../../Entities/Card/Card.Types'

interface CommandPanelProps {
    /** The card the commands act on. */
    card: Card
}

export const CommandPanel: React.FC<CommandPanelProps> = ({ card }) => {
    const [entries, setEntries] = useState<CardCommandEntry[]>([])
    const [draft, setDraft] = useState('')
    const transcriptRef = useRef<HTMLDivElement | null>(null)

    const submit = () => {
        const entered = draft.trim()
        if (!entered) return

        setDraft('')
        append(...respondTo(entered, card))
    }

    return (
        <Paper className="glass-inner-engraved"
               sx={{ p: 1,
                     display: 'flex',
                     flexDirection: 'column',
                     gap: 0.5,
                     minWidth: COMMAND_PANEL_MIN_WIDTH,
                     flex: 1,
                     minHeight: 0,
                     height: '100%' }}>

            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexShrink: 0 }}>
                <Typography sx={{ fontSize: '0.7rem',
                                  fontWeight: 700,
                                  color: 'arc.onGlassStrong',
                                  letterSpacing: '0.06em' }}>
                    COMMANDS
                </Typography>

                <Tooltip title="Commands run against this card. Nothing here is stored — the transcript is this session only.">
                    <Typography sx={{ fontSize: '0.62rem', color: 'arc.onGlassMuted', cursor: 'help' }}>
                        this session
                    </Typography>
                </Tooltip>
            </Box>

            <Box ref={transcriptRef}
                 sx={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {entries.length === 0
                    ? <EmptyTranscript />
                    : entries.map(entry => <CommandEntry key={entry.id} entry={entry} />)}
            </Box>

            <Box sx={{ display: 'flex',
                       alignItems: 'center',
                       gap: 0.5,
                       flexShrink: 0,
                       px: 0.75,
                       borderRadius: 1,
                       border: '1px solid',
                       borderColor: 'arc.glassDivider',
                       backgroundColor: 'arc.glassHover',
                       '&:focus-within': { borderColor: 'arc.accentOnGlass' } }}>

                <Box component="span"
                     sx={{ fontFamily: '"DM Mono", ui-monospace, monospace',
                           fontWeight: 700,
                           color: 'arc.accentOnGlass',
                           fontSize: '0.8rem' }}>
                    &gt;
                </Box>

                <InputBase value={draft}
                           onChange={event => setDraft(event.target.value)}
                           onKeyDown={event => {
                               if (event.key !== 'Enter') return
                               event.preventDefault()
                               submit()
                           }}
                           placeholder="Type a command, or /help"
                           sx={{ flex: 1,
                                 fontSize: '0.75rem',
                                 color: 'arc.onGlass',
                                 fontFamily: '"DM Mono", ui-monospace, monospace',
                                 '& input::placeholder': { color: 'arc.onGlassMuted', opacity: 1 } }} />

                <IconButton size="small" onClick={submit} disabled={!draft.trim()} aria-label="Run">
                    <SendIcon sx={{ fontSize: '0.9rem',
                                    color: draft.trim() ? 'arc.accentOnGlass' : 'arc.onGlassMuted' }} />
                </IconButton>
            </Box>
        </Paper>
    )

    /** Adds entries and keeps the newest in view. */
    function append (...added: CardCommandEntry[]) {
        setEntries(previous => [...previous, ...added])

        // After the entries have been laid out, or the scroll lands short.
        requestAnimationFrame(() => {
            if (transcriptRef.current)
                transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
        })
    }
}

export default CommandPanel

// ── Presentation per kind ─────────────────────────────────────────────────────

/**
 * The sigil is what the kind looks like when the colour is not available — a
 * colour-blind reader, a screenshot in grayscale, a dim monitor. Colour alone
 * should never be the only carrier of a distinction.
 */
const KIND: Record<CardCommandKind, { colour: string; sigil: string; label: string }> = {
    command: { colour: 'arc.logCommand', sigil: '>', label: 'Command' },
    result: { colour: 'arc.logResult', sigil: '=', label: 'Result' },
    error: { colour: 'arc.logAlert', sigil: '!', label: 'Error' },
}

const clockFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })

/**
 * The grammar the console is being designed around.
 *
 * Wiring one up means calling the same API the rest of the board calls and
 * putting it through useBoardActions, so a command failure surfaces the way
 * every other failure does. Until then `/help` lists them and nothing else
 * claims to work.
 */
const PLANNED_COMMANDS = [
    ['/move <column>', 'move this card to a column'],
    ['/lane <swimlane>', 'move it to a swimlane'],
    ['/task <title>', 'add a task'],
    ['/done <task>', 'complete a task'],
    ['/due <date>', 'set the deadline'],
    ['/tag <name>', 'add a tag'],
]

// ── Pieces ────────────────────────────────────────────────────────────────────

const EmptyTranscript: React.FC = () => (
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1 }}>
        <Typography sx={{ fontSize: '0.68rem', color: 'arc.onGlassMuted', textAlign: 'center' }}>
            Nothing run yet. Type <Box component="span"
                                      sx={{ fontFamily: '"DM Mono", ui-monospace, monospace' }}>/help</Box> to
            see what this console understands.
        </Typography>
    </Box>
)

const CommandEntry: React.FC<{ entry: CardCommandEntry }> = ({ entry }) => {
    const kind = KIND[entry.kind]

    return (
        <Box sx={{ display: 'grid',
                   // Time, sigil, content. Fixed first two tracks so every row's
                   // content starts on the same x — that alignment is most of
                   // what makes a transcript scannable.
                   gridTemplateColumns: 'auto auto minmax(0, 1fr)',
                   gap: 0.75,
                   alignItems: 'baseline',
                   py: 0.3,
                   pl: 0.75,
                   borderLeft: '2px solid',
                   borderLeftColor: kind.colour,
                   '&:hover': { backgroundColor: 'arc.glassHover' } }}>

            <Typography component="time"
                        sx={{ fontFamily: '"DM Mono", ui-monospace, monospace',
                              fontSize: '0.62rem',
                              color: 'arc.onGlassMuted',
                              whiteSpace: 'nowrap' }}>
                {clockFormat.format(entry.at)}
            </Typography>

            <Tooltip title={kind.label} placement="left" describeChild>
                <Box component="span"
                     aria-label={kind.label}
                     sx={{ fontFamily: '"DM Mono", ui-monospace, monospace',
                           fontSize: '0.7rem',
                           fontWeight: 700,
                           color: kind.colour,
                           width: '1ch',
                           textAlign: 'center' }}>
                    {kind.sigil}
                </Box>
            </Tooltip>

            <Typography sx={{ fontSize: '0.7rem',
                              lineHeight: 1.4,
                              color: entry.kind === 'command' ? 'arc.logCommand' : 'arc.onGlass',
                              fontFamily: entry.kind === 'command'
                                  ? '"DM Mono", ui-monospace, monospace'
                                  : undefined }}>
                {entry.content.map((span, index) => <Span key={index} span={span} />)}
            </Typography>
        </Box>
    )
}

const Span: React.FC<{ span: CardCommandSpan }> = ({ span }) => {
    if ('text' in span) return <>{span.text} </>

    return (
        <>
            <Box component="span"
                 sx={{ display: 'inline-block',
                       px: 0.6,
                       borderRadius: 0.75,
                       backgroundColor: 'arc.glassSelected',
                       color: 'arc.onGlassStrong',
                       fontWeight: 600,
                       // A name can be long and is not breakable mid-word by
                       // choice; let it wrap at the pill rather than push the
                       // panel wider.
                       overflowWrap: 'anywhere' }}>
                {span.entity}
            </Box>{' '}
        </>
    )
}

// ── Running a line ────────────────────────────────────────────────────────────

/**
 * What the console says back.
 *
 * Returns the echo of the line plus its answer, so the caller appends both at
 * once and they always carry the same timestamp.
 */
function respondTo (entered: string, card: Card): CardCommandEntry[] {
    const at = new Date()
    const id = `${at.getTime()}`
    const echo: CardCommandEntry = { id, kind: 'command', at, content: [text(entered)] }

    if (!entered.startsWith('/'))
        return [echo, answer(`${id}-r`, at, 'error',
                             'Commands start with /. Try /help.')]

    const [name] = entered.slice(1).split(/\s+/)

    if (name === 'help')
        return [echo, answer(`${id}-r`, at, 'result',
                             PLANNED_COMMANDS.map(([usage, what]) => `${usage} — ${what}`).join('   '))]

    if (name === 'where')
        return [echo, answer(`${id}-r`, at, 'result',
                             `${card.title} is in ${card.columnName} on ${card.swimlaneName}.`)]

    if (PLANNED_COMMANDS.some(([usage]) => usage.startsWith(`/${name} `)))
        return [echo, answer(`${id}-r`, at, 'error',
                             `/${name} is designed but not wired up yet.`)]

    return [echo, answer(`${id}-r`, at, 'error', `No command called /${name}. Try /help.`)]
}

function answer (id: string, at: Date, kind: CardCommandKind, message: string): CardCommandEntry {
    return { id, kind, at, content: [text(message)] }
}

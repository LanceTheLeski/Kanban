/**
 * TagsPanel
 *
 * A card's tags, as small pills, beside the title.
 *
 * Replaces the static 120x60 "Tags…" paper that held the space in both the
 * Blazor original and the port.
 *
 * ── Why it is small and beside the title rather than a block below it ────────
 * It was briefly a full-width panel under the title. That is the right shape for
 * somewhere tags are a primary axis — a filter sidebar, a tag manager — and the
 * wrong one here: a card carries a handful of tags, they are read at a glance
 * rather than worked with, and a block gave them more of the column than the
 * task list got.
 *
 * Back beside the title, at the size a glanceable label should be. It keeps the
 * position the Blazor original chose, which was right; only the content inside
 * it was a placeholder.
 *
 * ── Overflow ─────────────────────────────────────────────────────────────────
 * Pills wrap and the box scrolls. Nothing here grows, because it sits in a row
 * with the title: growing would push the task list down by an amount depending
 * on how many tags someone added.
 *
 * ── Status: the UI is real, the persistence is not ───────────────────────────
 * The server has tags — Tag, TagController, TagCreateRequest, and POST/PATCH/
 * DELETE on /arcstrides/tags — but there is no way to *read* the tags belonging
 * to a card. CardResponse carries none, and the only GET is by a tag's own ID,
 * which you cannot know without having already read it from somewhere.
 *
 * Writing a tag here would put a row in the table the board could never show
 * again: gone on reload, duplicated on the next attempt. That is worse than not
 * saving, because it fails silently and leaves rows behind. So tags are held in
 * local state and the panel says so — the warning dot in the corner, rather than
 * a line of text, because the space is tight and the note is not the point.
 *
 * This project has already paid for a stub that reported success without doing
 * anything (CreateTaskTypeOverlay), and the two bugs it caused pointed anywhere
 * but at it.
 *
 * One of these unblocks it, and the first is much the smaller change:
 *   - include the parent's tags on CardResponse, the way tasks already are; or
 *   - GET /arcstrides/tags?parentID={id}, which the Tags table already supports
 *     since a tag's RowKey *is* its parent's ID.
 *
 * Showing tags on the board tile itself needs the same read path — the board
 * cannot render what it is never sent.
 */

import React, { useState } from 'react'
import { Box, IconButton, InputBase, Paper, Tooltip, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { TAGS_BOX_WIDTH } from '../../../Styles/Measures'

export interface CardTag {
    id: string
    title: string
}

interface TagsPanelProps {
    tags: CardTag[]
    onChange: (tags: CardTag[]) => void
}

export const TagsPanel: React.FC<TagsPanelProps> = ({ tags, onChange }) => {
    const [draft, setDraft] = useState('')

    const add = () => {
        const title = draft.trim()
        if (!title) return

        // Case-insensitive, because "Blocked" and "blocked" being two tags is
        // never what anyone meant.
        if (tags.some(tag => tag.title.toLowerCase() === title.toLowerCase())) {
            setDraft('')
            return
        }

        onChange([...tags, { id: `local-${Date.now()}`, title }])
        setDraft('')
    }

    const remove = (id: string) => onChange(tags.filter(tag => tag.id !== id))

    return (
        <Paper className="card-stock"
               sx={{ // Shrinks before the title does, and never grows past its share.
                     flex: `0 1 ${TAGS_BOX_WIDTH}`,
                     minWidth: 0,
                     alignSelf: 'stretch',
                     display: 'flex',
                     flexDirection: 'column',
                     gap: 0.25,
                     p: 0.5,
                     position: 'relative' }}>
            {/*
                The "not saved" warning as a dot in the corner. A line of text
                would cost a third of the box, and the note is context rather
                than content.
            */}
            <Tooltip title="The API can create and delete tags but cannot yet list the tags on a card, so these are not saved. See the note in TagsPanel.tsx.">
                <Box aria-label="Tags are not saved yet"
                     sx={{ position: 'absolute',
                           top: 3,
                           right: 4,
                           width: 6,
                           height: 6,
                           borderRadius: '50%',
                           backgroundColor: 'arc.logAlert',
                           cursor: 'help' }} />
            </Tooltip>

            {/* The pills. Scrolls rather than growing — see the header. */}
            <Box sx={{ flex: 1,
                       minHeight: 0,
                       overflowY: 'auto',
                       display: 'flex',
                       flexWrap: 'wrap',
                       alignContent: 'flex-start',
                       gap: 0.35,
                       pr: 1 }}>
                {tags.length === 0 && (
                    <Typography sx={{ fontSize: '0.6rem', color: 'arc.onPaperMuted', lineHeight: 1.6 }}>
                        Tags…
                    </Typography>
                )}

                {/*
                    Each tag is its own small piece of card, set down at a
                    fraction of a degree off square. They used to be round
                    translucent lozenges, which is the right shape for a chip on
                    glass and the wrong one on a panel that is itself a piece of
                    card — the pills read as holes punched in it.
                */}
                {tags.map(tag => (
                    <Box key={tag.id}
                         className="card-stock-flat card-tilt"
                         sx={{ display: 'inline-flex',
                               alignItems: 'center',
                               gap: 0.1,
                               pl: 0.6,
                               pr: 0.1,
                               maxWidth: '100%' }}>
                        <Typography sx={{ fontSize: '0.6rem',
                                          lineHeight: 1.5,
                                          fontWeight: 600,
                                          letterSpacing: '0.02em',
                                          color: 'arc.onPaperStrong',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap' }}>
                            {tag.title}
                        </Typography>

                        <IconButton size="small"
                                    onClick={() => remove(tag.id)}
                                    aria-label={`Remove tag ${tag.title}`}
                                    sx={{ p: 0.1,
                                          color: 'arc.onPaperMuted',
                                          '&:hover': { color: 'arc.paperDanger' } }}>
                            <CloseIcon sx={{ fontSize: '0.6rem' }} />
                        </IconButton>
                    </Box>
                ))}
            </Box>

            {/* Pinned below the scroller so it never scrolls out of reach. */}
            <Box sx={{ display: 'flex',
                       alignItems: 'center',
                       flexShrink: 0,
                       pl: 0.5,
                       borderTop: '1px solid',
                       borderTopColor: 'arc.paperDivider' }}>
                <InputBase value={draft}
                           onChange={event => setDraft(event.target.value)}
                           onKeyDown={event => {
                               if (event.key !== 'Enter') return
                               event.preventDefault()
                               add()
                           }}
                           placeholder="Add"
                           sx={{ flex: 1,
                                 minWidth: 0,
                                 fontSize: '0.6rem',
                                 color: 'arc.onPaper',
                                 '& input': { p: 0 },
                                 '& input::placeholder': { color: 'arc.onPaperMuted', opacity: 1 } }} />
                <IconButton size="small" onClick={add} disabled={!draft.trim()} aria-label="Add tag" sx={{ p: 0.15 }}>
                    <AddIcon sx={{ fontSize: '0.7rem',
                                   color: draft.trim() ? 'arc.paperAccent' : 'arc.onPaperMuted' }} />
                </IconButton>
            </Box>
        </Paper>
    )
}

export default TagsPanel

/**
 * TagsPanel
 *
 * A card's tags, as pills.
 *
 * Replaces the static "Tags…" paper that held the space in both the Blazor
 * original and the port.
 *
 * ── Layout ───────────────────────────────────────────────────────────────────
 * Pills wrap and the panel scrolls once they exceed its height, rather than the
 * panel growing. A card can carry a lot of tags and this sits in a fixed column
 * beside the title — letting it grow would push the task list down by an amount
 * that depends on how many tags someone added, which is exactly the kind of
 * layout that looks fine until it does not.
 *
 * The add field stays pinned below the scroller so it does not scroll away.
 *
 * ── Status: the UI is real, the persistence is not ───────────────────────────
 * The server has tags — Tag, TagController, TagCreateRequest, and POST/PATCH/
 * DELETE on /arcstrides/tags — but there is no way to *read* the tags belonging
 * to a card. CardResponse carries none, and the only GET is by a tag's own ID,
 * which you cannot know without having already read it from somewhere.
 *
 * So writing a tag here would put a row in the table that the board could never
 * show again: it would vanish on reload and reappear as a duplicate on the next
 * attempt. That is worse than not saving, because it fails silently and leaves
 * rows behind.
 *
 * Tags are therefore held in local state and the panel says so on screen. This
 * project has already paid for a stub that reported success without doing
 * anything — CreateTaskTypeOverlay — and the two bugs it caused pointed
 * anywhere but at it.
 *
 * One of these unblocks it, and the first is much the smaller change:
 *   - include the parent's tags on CardResponse, the way tasks already are; or
 *   - GET /arcstrides/tags?parentID={id}, which the Tags table already supports
 *     since a tag's RowKey *is* its parent's ID.
 */

import React, { useState } from 'react'
import { Box, IconButton, InputBase, Paper, Tooltip, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { TAGS_PANEL_MAX_HEIGHT, TAGS_PANEL_MIN_HEIGHT } from '../../../Styles/Measures'

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
        <Paper
            className="glass-inner-engraved"
            sx={{
                p: 0.75,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                minHeight: TAGS_PANEL_MIN_HEIGHT,
                maxHeight: TAGS_PANEL_MAX_HEIGHT,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexShrink: 0 }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'arc.onGlassStrong', letterSpacing: '0.06em' }}>
                    TAGS
                </Typography>
                <Tooltip title="The API can create and delete tags but cannot yet list the tags on a card, so these are not saved. See the note in TagsPanel.tsx.">
                    <Typography sx={{ fontSize: '0.6rem', color: 'arc.logAlert', cursor: 'help' }}>
                        not saved yet
                    </Typography>
                </Tooltip>
            </Box>

            {/* The pills. Scrolls rather than growing — see the header. */}
            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignContent: 'flex-start',
                    gap: 0.5,
                }}
            >
                {tags.length === 0 && (
                    <Typography sx={{ fontSize: '0.7rem', color: 'arc.onGlassMuted', alignSelf: 'center' }}>
                        No tags yet.
                    </Typography>
                )}

                {tags.map(tag => (
                    <Box
                        key={tag.id}
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.25,
                            pl: 0.85,
                            pr: 0.25,
                            py: 0.15,
                            // Fully round: a pill, not a chip with corners.
                            borderRadius: 999,
                            backgroundColor: 'arc.glassSelected',
                            border: '1px solid',
                            borderColor: 'arc.glassDivider',
                            maxWidth: '100%',
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: '0.7rem',
                                color: 'arc.onGlassStrong',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {tag.title}
                        </Typography>

                        <IconButton
                            size="small"
                            onClick={() => remove(tag.id)}
                            aria-label={`Remove tag ${tag.title}`}
                            sx={{ p: 0.15, color: 'arc.onGlassMuted', '&:hover': { color: 'arc.dangerOnGlass' } }}
                        >
                            <CloseIcon sx={{ fontSize: '0.75rem' }} />
                        </IconButton>
                    </Box>
                ))}
            </Box>

            {/* Pinned below the scroller so it never scrolls out of reach. */}
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
                    '&:focus-within': { borderColor: 'arc.accentOnGlass' },
                }}
            >
                <InputBase
                    value={draft}
                    onChange={event => setDraft(event.target.value)}
                    onKeyDown={event => {
                        if (event.key !== 'Enter') return
                        event.preventDefault()
                        add()
                    }}
                    placeholder="Add a tag"
                    sx={{
                        flex: 1,
                        fontSize: '0.7rem',
                        color: 'arc.onGlass',
                        '& input::placeholder': { color: 'arc.onGlassMuted', opacity: 1 },
                    }}
                />
                <IconButton size="small" onClick={add} disabled={!draft.trim()} aria-label="Add tag">
                    <AddIcon sx={{ fontSize: '0.85rem', color: draft.trim() ? 'arc.accentOnGlass' : 'arc.onGlassMuted' }} />
                </IconButton>
            </Box>
        </Paper>
    )
}

export default TagsPanel

/**
 * TagColoursOverlay
 *
 * Every tag there is, and its colour: the board's Tags menu (BoardNavBar).
 *
 *   ┌ Tag colours ──────────────────────────────────────────┐
 *   │ [Blocked] [Design] [Waiting]          ← the tags       │
 *   │                                                        │
 *   │ Blocked                                                │
 *   │ PAPER  ▭ ▭ ▭ ▭ ▭ ▭ ▭ ▭   YOURS ▭  [● Mix…]   Default   │
 *   │                                   Discard   Save       │
 *   └────────────────────────────────────────────────────────┘
 *
 * Pick a tag, then its colour, in the picker columns and swimlanes use
 * (ArcColourPicker). Each tag is drawn in the colour it will have, so the row
 * of tags is the preview. Nothing is written until Save, which writes each tag
 * changed — one colour for a tag everywhere it is, on every card, task and day
 * — and reads the board again so its cards' tags show it. Discard drops it all.
 *
 * The tags are every tag there is, not only this board's: a tag is not on a
 * board (a day is on none), and "Blocked" is the same tag wherever it is. A tag
 * on nothing now, whose last card or task was deleted, is still here.
 *
 * Tag groups — a colour for a set of tags, and tags that belong to a column or a
 * swimlane — are for later.
 */

import React, { useEffect, useState } from 'react'
import { Box, ButtonBase, Typography } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { ArcColourPicker } from '../../../Components/ArcColourPicker'
import { useBoardActions } from '../../Board/Hooks/useBoardActions'
import { fetchTagLibrary, updateTagColour } from './Tag.APIs'
import { DEFAULT_TAG_COLOUR, tagStyle } from './Tag.Colours'
import type { Tag } from '../../../Entities/Tag/Tag.Types'

interface TagColoursOverlayProps
{
    open: boolean

    onClose: () => void
}

export const TagColoursOverlay: React.FC<TagColoursOverlayProps> = ({ open, onClose }) =>
{
    const { run } = useBoardActions()
    const [tags, setTags] = useState<Tag[] | null>(null)
    const [failed, setFailed] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)

    // The colours as chosen here, by tag, until Save.
    const [drafts, setDrafts] = useState<Map<string, string | null>>(() => new Map())

    useEffect(() =>
    {
        let current = true
        fetchTagLibrary().then(library =>
        {
            if (current)
                setTags(library)
        })
                         .catch(() =>
                         {
                             if (current)
                                 setFailed(true)
                         })
        return () => { current = false }
    }, [])

    const colourOf = (tag: Tag) => (drafts.has(tag.id)
        ? drafts.get(tag.id)!
        : tag.colour)
    const selected = tags?.find(tag => tag.id === selectedId) ?? null
    const changed = (tags ?? []).filter(tag => drafts.has(tag.id) && drafts.get(tag.id) !== tag.colour)

    const handleSubmit = async () =>
    {
        if (changed.length === 0)
        {
            onClose()
            return
        }
        const saved = await run(changed.length === 1
            ? `Colouring "${changed[0].title}"`
            : `Colouring ${changed.length} tags`,
                                () => Promise.all(changed.map(tag => updateTagColour(tag.id, colourOf(tag)))))
        if (saved)
            onClose()
    }

    return (
        <ArcOverlay open={open}
                    onClose={onClose}
                    onSubmit={handleSubmit}
                    title="Tag colours"
                    titleStock="red">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0 }}>
                { tags === null && (
                    <Typography sx={{ fontSize: '0.8rem', color: 'arc.onGlassMuted' }}>
                        { failed
                            ? 'The tags could not be read. Close this and try again.'
                            : 'Reading the tags…'
                        }
                    </Typography>
                )
                }
                { tags?.length === 0 && (
                    <Typography sx={{ fontSize: '0.8rem', color: 'arc.onGlassMuted' }}>
                        No tags yet. Put one on a card, a task or a day, and it is here to colour.
                    </Typography>
                )
                }

                {/* The tags, each in the colour it will have: pick one to colour it. */}
                { tags && tags.length > 0 && (
                    <Box role="group"
                         aria-label="Tags"
                         className="card-stock paper-blue"
                         sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, p: 1 }}>
                        { tags.map(tag =>
                                   (
                                       <ButtonBase key={tag.id}
                                                   onClick={() => setSelectedId(tag.id)}
                                                   aria-pressed={tag.id === selectedId}
                                                   className={tag.id === selectedId
                                                       ? 'card-stock card-tilt paper-red'
                                                       : 'card-stock-flat card-tilt paper-red'}
                                                   style={tagStyle(colourOf(tag))}
                                                   sx={{ px: 0.9,
                                                         py: 0.3,
                                                         fontSize: '0.72rem',
                                                         fontWeight: tag.id === selectedId
                                                             ? 800
                                                             : 600,
                                                         color: 'arc.onPaperStrong',
                                                         outline: tag.id === selectedId
                                                             ? '2px solid'
                                                             : 'none',
                                                         outlineColor: 'arc.paperAccent',
                                                         outlineOffset: 1,
                                                         '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 }
                                                      }}>
                                           { tag.title }
                                       </ButtonBase>
                                   ))
                        }
                    </Box>
                )
                }

                { tags && tags.length > 0 && !selected && (
                    <Typography sx={{ fontSize: '0.75rem', color: 'arc.onGlassMuted' }}>
                        Choose a tag to colour it. A tag's colour is the same wherever it is.
                    </Typography>
                )
                }

                {/* Keyed on the tag, so each opens the picker from its own colour. */}
                { selected && (
                    <ArcColourPicker key={selected.id}
                                     value={colourOf(selected)}
                                     onChange={colour => setDrafts(current => new Map(current).set(selected.id, colour))}
                                     fallback={DEFAULT_TAG_COLOUR}
                                     label={`${selected.title}'s colour`} />
                )
                }
            </Box>
        </ArcOverlay>
    )
}

export default TagColoursOverlay

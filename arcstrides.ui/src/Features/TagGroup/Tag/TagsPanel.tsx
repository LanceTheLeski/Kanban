/**
 * TagsPanel
 *
 * A thing's tags, as small pieces of card, with a line to add one: a card's
 * beside its title, a task's beside its, a day's beside its picture.
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
 * ── One tag, wherever it is ──────────────────────────────────────────────────
 * Typing offers the tags that exist already, from every card, task and day, and
 * choosing one puts that tag on — the same tag, not another with the same
 * name. One typed that matches an existing tag but for case is that tag too;
 * the server matches titles the same way (TagRepository.AttachLabelAsync).
 *
 * ── Saved by whoever holds it ────────────────────────────────────────────────
 * This only edits a list. The card editor, the task popover and the day
 * overlay keep it as a draft and write it when they are saved (Tag.APIs,
 * saveTags; useDayDraft). It used to be held for
 * the session only, with a warning dot, because nothing could read a tag back;
 * tags now arrive with the things they are on.
 */

import React, { useRef, useState } from 'react'
import { Box, ButtonBase, IconButton, InputBase, Paper, Popper, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { TAGS_BOX_WIDTH } from '../../../Styles/Measures'
import { fetchTagLibrary, newTag } from './Tag.APIs'
import { tagStyle } from './Tag.Colours'
import type { Tag } from '../../../Entities/Tag/Tag.Types'

interface TagsPanelProps
{
    tags: Tag[]

    onChange: (tags: Tag[]) => void

    /** What the tags are on, read out: "Card tags", "Task tags". */
    label?: string
}

export const TagsPanel: React.FC<TagsPanelProps> = ({ tags, onChange, label = 'Tags' }) =>
{
    const [draft, setDraft] = useState('')
    const [highlight, setHighlight] = useState(0)
    // State rather than a ref: the list is placed from it while rendering.
    const [row, setRow] = useState<HTMLDivElement | null>(null)
    const library = useTagLibrary()

    // What the line offers: tags that exist, match what is typed, and are not on already.
    const typed = draft.trim().toLowerCase()
    const offers = typed
        ? library.tags.filter(tag => tag.title.toLowerCase().includes(typed) && !tags.some(on => on.id === tag.id))
                      .slice(0, OFFERS)
        : []

    const add = (chosen?: Tag) =>
    {
        const title = draft.trim()
        const tag = chosen
            ?? library.tags.find(existing => existing.title.toLowerCase() === title.toLowerCase())
            ?? (title
                ? newTag(title)
                : null)
        setDraft('')
        setHighlight(0)
        if (!tag)
            return

        // Case-insensitive, because "Blocked" and "blocked" being two tags is
        // never what anyone meant.
        if (tags.some(on => on.id === tag.id || on.title.toLowerCase() === tag.title.toLowerCase()))
            return

        onChange([...tags, tag])
    }

    const remove = (id: string) => onChange(tags.filter(tag => tag.id !== id))

    const keys = (event: React.KeyboardEvent) =>
    {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp')
        {
            event.preventDefault()
            setHighlight(current => (current + (event.key === 'ArrowDown'
                ? 1
                : offers.length - 1)) % Math.max(offers.length, 1))
            return
        }
        if (event.key === 'Escape' && draft)
        {
            event.stopPropagation()
            setDraft('')
            return
        }
        if (event.key !== 'Enter')
            return
        event.preventDefault()
        add(offers[highlight])
    }

    return (
        <Paper className="card-stock paper-blue"
               role="group"
               aria-label={label}
               sx={{ // Shrinks before the title does, and never grows past its share.
                     flex: `0 1 ${TAGS_BOX_WIDTH}`,
                     minWidth: 0,
                     alignSelf: 'stretch',
                     display: 'flex',
                     flexDirection: 'column',
                     gap: 0.25,
                     p: 0.5,
                     position: 'relative'
                  }}>
            {/* The pills. Scrolls rather than growing — see the header. */}
            <Box component="ul"
                 sx={{ flex: 1,
                       minHeight: 0,
                       overflowY: 'auto',
                       display: 'flex',
                       flexWrap: 'wrap',
                       alignContent: 'flex-start',
                       gap: 0.35,
                       m: 0,
                       p: 0,
                       listStyle: 'none'
                    }}>
                { tags.length === 0 && (
                    <Typography component="li"
                                sx={{ fontSize: '0.6rem', color: 'arc.onPaperMuted', lineHeight: 1.6 }}>
                        Tags…
                    </Typography>
                )
                }

                {/*
                    Each tag is its own small piece of card, set down at a
                    fraction of a degree off square, and cut from a different
                    stock than the panel under them. They used to be round
                    translucent lozenges, which is the right shape for a chip on
                    glass and the wrong one on a panel that is itself a piece of
                    card — the pills read as holes punched in it.

                    Red on blue, unless the tag has a colour of its own, chosen
                    from the board's Tags menu (Tag.Colours). One stock says
                    "these are a different kind of thing from the board they are
                    pinned to", which is the part that has to read.
                */}
                { tags.map(tag =>
                           (
                               <Box key={tag.id}
                                    component="li"
                                    className="card-stock-flat card-tilt paper-red"
                                    style={tagStyle(tag.colour)}
                                    sx={{ display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 0.1,
                                          pl: 0.6,
                                          pr: 0.1,
                                          maxWidth: '100%'
                                       }}>
                                   <Typography sx={{ fontSize: '0.6rem',
                                                     lineHeight: 1.5,
                                                     fontWeight: 600,
                                                     letterSpacing: '0.02em',
                                                     color: 'arc.onPaperStrong',
                                                     overflow: 'hidden',
                                                     textOverflow: 'ellipsis',
                                                     whiteSpace: 'nowrap'
                                                  }}>
                                       { tag.title }
                                   </Typography>

                                   <IconButton size="small"
                                               onClick={() => remove(tag.id)}
                                               aria-label={`Remove tag ${tag.title}`}
                                               sx={{ p: 0.1,
                                                     color: 'arc.onPaperMuted',
                                                     '&:hover': { color: 'arc.paperDanger' }
                                                  }}>
                                       <CloseIcon sx={{ fontSize: '0.6rem' }} />
                                   </IconButton>
                               </Box>
                           ))
                }
            </Box>

            {/* Pinned below the scroller so it never scrolls out of reach. */}
            <Box ref={setRow}
                 sx={{ display: 'flex',
                       alignItems: 'center',
                       flexShrink: 0,
                       pl: 0.5,
                       borderTop: '1px solid',
                       borderTopColor: 'arc.paperDivider'
                    }}>
                <InputBase value={draft}
                           onChange={event =>
                           {
                               setDraft(event.target.value)
                               setHighlight(0)
                           }}
                           onFocus={library.load}
                           onKeyDown={keys}
                           placeholder="Add"
                           inputProps={{ 'aria-label': `Add a tag to ${label.toLowerCase()}`,
                                         'aria-autocomplete': 'list',
                                         'aria-expanded': offers.length > 0
                                      }}
                           sx={{ flex: 1,
                                 minWidth: 0,
                                 fontSize: '0.6rem',
                                 color: 'arc.onPaper',
                                 '& input': { p: 0 },
                                 '& input::placeholder': { color: 'arc.onPaperMuted', opacity: 1 }
                              }} />
                <IconButton size="small"
                            onClick={() => add(offers[highlight])}
                            disabled={!draft.trim()}
                            aria-label="Add tag"
                            sx={{ p: 0.15 }}>
                    <AddIcon sx={{ fontSize: '0.7rem',
                                   color: draft.trim()
                                       ? 'arc.paperAccent'
                                       : 'arc.onPaperMuted'
                                }} />
                </IconButton>
            </Box>

            {/*
                The tags that exist and match, under the line, while typing.
                Enter takes the highlighted one; with none, what is typed — which
                the server matches to an existing tag by title anyway.
            */}
            <Popper open={offers.length > 0}
                    anchorEl={row}
                    placement="bottom-start"
                    sx={{ zIndex: 1500 }}>
                <Box component="ul"
                     role="listbox"
                     aria-label="Tags that exist"
                     className="card-stock"
                     sx={{ m: 0,
                           mt: 0.5,
                           p: 0.5,
                           listStyle: 'none',
                           minWidth: '9rem',
                           display: 'flex',
                           flexDirection: 'column',
                           gap: 0.25
                        }}>
                    { offers.map((tag, index) =>
                                 (
                                     <Box key={tag.id}
                                          component="li"
                                          role="option"
                                          aria-selected={index === highlight}>
                                         <ButtonBase onMouseDown={event => event.preventDefault()}
                                                     onClick={() => add(tag)}
                                                     sx={{ width: '100%',
                                                           justifyContent: 'flex-start',
                                                           px: 0.75,
                                                           py: 0.3,
                                                           borderRadius: '2px',
                                                           fontSize: '0.66rem',
                                                           fontWeight: 600,
                                                           color: 'arc.onPaperStrong',
                                                           backgroundColor: index === highlight
                                                               ? 'arc.paperSelected'
                                                               : 'transparent',
                                                           '&:hover': { backgroundColor: 'arc.paperHover' }
                                                        }}>
                                             { tag.title }
                                         </ButtonBase>
                                     </Box>
                                 ))
                    }
                </Box>
            </Popper>
        </Paper>
    )
}

export default TagsPanel

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** How many existing tags the line offers at once. */
const OFFERS = 5

/**
 * Every tag there is, read the first time the line is used — not when the panel
 * is drawn, which is on every card and task opened, most of them never tagged.
 * A failed read offers nothing; typing still works.
 */
function useTagLibrary(): { tags: Tag[]; load: () => void }
{
    const [tags, setTags] = useState<Tag[]>([])
    const requested = useRef(false)

    const load = () =>
    {
        if (requested.current)
            return
        requested.current = true
        fetchTagLibrary().then(setTags)
                         .catch(() =>
                         {
                             requested.current = false
                         })
    }

    return { tags, load }
}

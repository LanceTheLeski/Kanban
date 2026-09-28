/**
 * AddCardPicker
 *
 * "+ Add card" on a day, and the search it opens into.
 *
 * Closed, it is the same neutral piece of card as "+ New task" and "+ New task
 * type": the one "add a thing" action in its panel, in the one shape the app
 * uses for that. Open, it is a search over every card the calendar can reach
 * (see useCardChoices), grouped by board when there is more than one. Choosing
 * a card puts it on the day and closes the search; the upload happens behind
 * it — see Calendar.Store.
 */

import React, { useEffect, useRef, useState } from 'react'
import { Autocomplete, Button, TextField } from '@mui/material'
import { paperField } from '../../Styles/Paper'
import { useCardChoices, type CardChoice } from './useCardChoices'
import type { Card } from '../../Entities/Card/Card.Types'

interface AddCardPickerProps {
    /** Boards to offer cards from. */
    boardIds: string[]
    /** Cards already on the day, left out of the list. */
    onDay: Set<string>
    onPick: (card: Card) => void
    /** Open straight away — for a day opened from its "Add a card…" quick action. */
    startOpen?: boolean
}

export const AddCardPicker: React.FC<AddCardPickerProps> = ({ boardIds, onDay, onPick, startOpen = false }) => {
    const [open, setOpen] = useState(startOpen)
    const { choices, loading, error } = useCardChoices(boardIds, open)

    /*
       Focus the search once it is open, a frame late.

       `autoFocus` alone lost a race when the picker opened with its overlay —
       the "Add a card…" quick action: the overlay's focus trap runs after the
       field mounts and takes focus back to itself. Focus then was not in the
       search at all, so the first Escape went to the overlay and closed the
       whole day instead of just backing out of the search.
    */
    const inputRef = useRef<HTMLInputElement>(null)
    useEffect(() => {
        if (!open) return
        const frame = requestAnimationFrame(() => inputRef.current?.focus())
        return () => cancelAnimationFrame(frame)
    }, [open])

    const available = choices.filter(choice => !onDay.has(choice.card.id))
    const grouped = new Set(available.map(choice => choice.boardTitle)).size > 1

    if (!open) {
        return (
            <Button size="small"
                    variant="text"
                    className="card-stock"
                    onClick={() => setOpen(true)}
                    sx={{ alignSelf: 'flex-start',
                          px: 1,
                          fontSize: '0.7rem',
                          textTransform: 'none',
                          color: 'arc.onPaper',
                          '&:hover': { color: 'arc.onPaperStrong', backgroundColor: 'transparent' } }}>
                + Add card
            </Button>
        )
    }

    const field = paperField()

    return (
        <Autocomplete<CardChoice>
            options={available}
            loading={loading}
            openOnFocus
            autoHighlight
            groupBy={grouped ? choice => choice.boardTitle : undefined}
            getOptionLabel={choice => choice.card.title || 'Untitled'}
            // Keyed by card, not by label: two boards can each have a card of
            // the same name, and the label is the default key.
            getOptionKey={choice => choice.card.id}
            isOptionEqualToValue={(option, value) => option.card.id === value.card.id}
            loadingText="Reading cards…"
            // The list is a piece of card set down over the panel, like the
            // date pickers' calendars — not MUI's own paper, which renders here
            // as a blue pane in body-size type beside a panel of 0.8rem notes.
            slotProps={{ paper: { className: 'card-stock', sx: LIST_SX } }}
            noOptionsText={error ?? (choices.length > 0 ? 'Every card is already on this day.' : 'No cards to add.')}
            onChange={(_, choice) => {
                if (!choice) return
                setOpen(false)
                onPick(choice.card)
            }}
            onClose={(_, reason) => {
                // Escape and clicking away put the button back; choosing an
                // option is handled by onChange above.
                if (reason === 'escape' || reason === 'blur') setOpen(false)
            }}
            renderInput={params => (
                <TextField {...params}
                           variant={field.variant}
                           // No label, so no room kept above the text for one.
                           hiddenLabel
                           sx={field.sx}
                           inputRef={inputRef}
                           placeholder="Find a card"
                           inputProps={{ ...params.inputProps, 'aria-label': 'Find a card to add to this day' }}
                           InputProps={{ ...params.InputProps,
                                         ...field.InputProps,
                                         className: `${params.InputProps.className ?? ''} ${field.InputProps.className}` }} />
            )} />
    )
}

export default AddCardPicker

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

const LIST_SX = {
    mt: 0.5,
    '& .MuiAutocomplete-listbox': { py: 0.5 },
    '& .MuiAutocomplete-option': { fontSize: '0.78rem', minHeight: 'auto', py: 0.6, color: 'arc.onPaperStrong' },
    '& .MuiAutocomplete-option.Mui-focused': { backgroundColor: 'arc.paperHover' },
    '& .MuiAutocomplete-option[aria-selected="true"]': { backgroundColor: 'arc.paperSelected' },
    '& .MuiAutocomplete-groupLabel': { backgroundColor: 'transparent',
                                       fontSize: '0.62rem',
                                       fontWeight: 700,
                                       letterSpacing: '0.06em',
                                       textTransform: 'uppercase',
                                       lineHeight: 2.2,
                                       color: 'arc.onPaperMuted' },
    '& .MuiAutocomplete-noOptions, & .MuiAutocomplete-loading': { fontSize: '0.75rem', color: 'arc.onPaperMuted' },
} as const

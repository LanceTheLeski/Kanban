/**
 * Paper.ts
 *
 * The sx every input sitting on card stock needs.
 *
 * MUI's outlined and filled inputs both draw their own ground and their own
 * border. On card stock that is a second rectangle a pixel inside the first,
 * which reads as a rendering fault rather than as emphasis — so the field *is*
 * the piece of card (className="card-stock"), its notch is turned off, and what
 * is left here is the colours and the sizing.
 *
 * It lives in Styles rather than in a component because six overlays, two
 * popovers and the timeline's two pickers all need exactly this, and the last
 * time a value like it was copied between files the two copies drifted within a
 * week — see the font stacks in Fonts.ts.
 */

import type { SxProps, Theme } from '@mui/material'

/**
 * Every prop a text field needs to be a piece of card you write on.
 *
 * Spread rather than copied: `<TextField {...paperField()} placeholder="…" />`.
 *
 * ── Why the class goes on the input, not the field ──────────────────────────
 * TextField's own className lands on the FormControl, which wraps the input
 * *and* its helper text. Put the card there and the hint is printed on the card,
 * which is the wrong relationship — a hint is something said about the field,
 * not something written on it. On the input, the card is the field and the hint
 * sits below it on the pane.
 *
 * ── Why the padding is stated ───────────────────────────────────────────────
 * The filled variant reserves 25px at the top for a floating label. These
 * fields have no label — that is the whole point, the label was the duplicate
 * word this replaced — so without overriding it every one of them is a third
 * taller than its own text, with the text pushed to the bottom.
 */
export function paperField(stock?: 'blue' | 'red' | 'green' | 'yellow') {
    return {
        variant: 'filled' as const,
        InputProps: {
            className: `card-stock${stock ? ` paper-${stock}` : ''}`,
            disableUnderline: true,
        },
        sx: paperFieldSx,
    }
}

/** The colours and sizing. Exported for the two fields that set their own props. */
export const paperFieldSx: SxProps<Theme> = {
    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
    '& .MuiFilledInput-root': { backgroundColor: 'transparent' },
    '& .MuiFilledInput-input': { padding: '9px 11px' },
    '& .MuiInputBase-input': { color: 'arc.onPaperStrong', fontSize: '0.82rem' },
    '& .MuiInputBase-input::placeholder': { color: 'arc.onPaperMuted', opacity: 1 },
    // The helper sits on the pane below the card, so it takes the on-glass ramp.
    '& .MuiFormHelperText-root': { color: 'arc.onGlassMuted', mx: 0.25, mt: 0.5 },
}

/**
 * A date or time picker on card stock.
 *
 * Keeps the outline, unlike the fields above: a picker is two controls in a row
 * and the boxes are what say where one ends and the next begins. The ground is
 * half a step down from the card, so it reads as somewhere to type.
 */
export const paperPickerSx: SxProps<Theme> = {
    minWidth: 0,
    '& .MuiOutlinedInput-root': { backgroundColor: 'arc.paperField' },
    '& input': { fontSize: '0.7rem', py: 0.6, color: 'arc.onPaperStrong' },
    '& input::placeholder': { color: 'arc.onPaperMuted', opacity: 1 },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'arc.paperDivider' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'arc.onPaperMuted' },
    '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'arc.paperAccent' },
    '& .MuiSvgIcon-root': { color: 'arc.onPaperMuted', fontSize: '1rem' },
}

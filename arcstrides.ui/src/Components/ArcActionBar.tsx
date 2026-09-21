/**
 * ArcActionBar
 *
 * The row of actions along the bottom of every overlay and popover.
 *
 * ── Why this exists ──────────────────────────────────────────────────────────
 * A window on a desktop OS puts its controls in the same corner every time, and
 * you stop having to look for them. Overlays here did not: ArcOverlay and
 * ArcPopover each built their own Submit/Discard group, and UpdateCardOverlay
 * grew a third control — "Delete Card" — as a separate button in its *content*,
 * above the bar, so the one destructive action on the board sat somewhere no
 * other overlay put anything.
 *
 * One component now owns that corner, so an overlay declares what it can do and
 * never decides where it goes.
 *
 * ── The arrangement ──────────────────────────────────────────────────────────
 *
 *     [ Delete ]  [ other actions… ]        ⟵ gap ⟶        [ Discard ] [ Save ]
 *
 * Bottom right for the pair, and Save rightmost. Both follow the direction the
 * page is read in: the commit is the last thing you reach, and it is where
 * Windows, macOS and GTK all put it. A left-hand bar would be the odd one out
 * on every platform this runs on.
 *
 * ── Delete goes to the far left, not next to Save ────────────────────────────
 * The instinct to put Delete just left of Save is the thing worth pushing back
 * on. Adjacency is what makes a misclick expensive: the two controls with the
 * least in common — "keep my work" and "destroy the record" — would be the two
 * closest together, and both get clicked by someone moving fast toward the
 * corner they have learned to aim at.
 *
 * Destructive actions go to the opposite end, separated by the flexible gap, so
 * reaching one is a deliberate move away from the corner rather than a near miss
 * into it. That is the same reason macOS alerts put Delete at the leading edge
 * and Cancel nearest the thumb.
 *
 * ── Confirmation happens in the bar ──────────────────────────────────────────
 * A destructive action swaps the bar for a confirm strip rather than opening a
 * dialog. An overlay is already a modal, and a confirmation dialog on top of one
 * is a second layer to dismiss, a second focus trap, and a second thing that can
 * be left open behind the first. Swapping in place keeps it to one surface, and
 * the question appears where the answer has to be clicked.
 */

import React, { useState } from 'react'
import { Box, Button, ButtonGroup, Typography } from '@mui/material'

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * An action beyond Save and Discard.
 *
 * Delete is common enough to have its own prop below, but it is only the first
 * of these — an overlay that wants Duplicate, Archive or Reset passes them here
 * and they line up beside Delete in the order given.
 */
export interface ArcAction {
    /** Shown on the button. */
    label: string
    onClick: () => void | Promise<void>
    /**
     * Destructive actions get the error colour and, unless `confirm` is given as
     * false, a confirmation step before they run.
     */
    destructive?: boolean
    /** The question asked before a destructive action runs. */
    confirm?: string | false
    disabled?: boolean
}

export interface ArcActionBarProps {
    /**
     * Omitted for a read-only surface — no Save button is rendered, which mirrors
     * the null check the Blazor razor did on OnSubmitAsync.
     */
    onSave?: () => Promise<void> | void
    onDiscard: () => void

    /** "Save" by default. Say what is being saved when it is not obvious. */
    saveLabel?: string
    discardLabel?: string
    /**
     * Colours the primary action as destructive.
     *
     * For an overlay whose whole purpose is the destructive act — DeleteColumn,
     * DeleteSwimlane — where the primary action genuinely belongs in the Save
     * slot, but a button reading "Save" that removes a column is the mismatch
     * this component exists to stop.
     */
    saveDestructive?: boolean

    /** Shorthand for the most common extra action. Confirms before it runs. */
    onDelete?: () => Promise<void> | void
    deleteLabel?: string
    /** The confirm question. Defaults to a generic one. */
    deleteConfirm?: string

    /** Anything beyond Delete. Rendered left to right after it. */
    actions?: ArcAction[]

    /** Squares off the bar's corners, for a popover where it sits flush. */
    flush?: boolean
    /** Stretches the Discard/Save pair to the full width, for a narrow popover. */
    fullWidth?: boolean
}

/**
 * How a button in the engraved bar is coloured.
 *
 * `color="error"` and `color="primary"` are MUI's palette slots, picked to sit
 * on a white surface. The bar is dark slate, so both come out too dark to read —
 * these are the same roles lifted onto a dark ground. See arc.dangerOnGlass.
 *
 * The hierarchy is deliberate: the primary action is the brightest thing in the
 * bar, Discard is quiet, and destructive is the only warm colour on the surface.
 * Discard being as loud as Save is what made the pair read as two equal choices.
 */
const barButtonSx = (tone: 'primary' | 'quiet' | 'danger') => ({
    color:
        tone === 'danger' ? 'arc.dangerOnGlass'
        : tone === 'primary' ? 'arc.accentOnGlass'
        : 'arc.onGlassMuted',
    fontWeight: tone === 'primary' ? 600 : 400,
    '&:hover': { backgroundColor: 'arc.glassHover' },
    '&.Mui-disabled': { color: 'arc.onGlassMuted', opacity: 0.5 },
})

// ── Component ─────────────────────────────────────────────────────────────────

export const ArcActionBar: React.FC<ArcActionBarProps> = ({
    onSave,
    onDiscard,
    saveLabel = 'Save',
    discardLabel = 'Discard',
    saveDestructive = false,
    onDelete,
    deleteLabel = 'Delete',
    deleteConfirm = 'Delete this permanently?',
    actions = [],
    flush = false,
    fullWidth = false,
}) => {
    const [busy, setBusy] = useState(false)

    // The action waiting on a yes, or null when the bar is showing normally.
    const [pending, setPending] = useState<{ label: string; question: string; run: () => void | Promise<void> } | null>(null)

    // The Delete shorthand is just the first entry in the same list everything
    // else goes through, so there is one code path rather than a special case.
    const allActions: ArcAction[] = [
        ...(onDelete
            ? [{ label: deleteLabel, onClick: onDelete, destructive: true, confirm: deleteConfirm }]
            : []),
        ...actions,
    ]

    const runGuarded = async (work: () => void | Promise<void>) => {
        setBusy(true)
        try {
            await work()
        } finally {
            // The overlay usually closes on success, so this may run against an
            // unmounted component; React 19 no-ops that rather than warning.
            setBusy(false)
            setPending(null)
        }
    }

    const handleAction = (action: ArcAction) => {
        const question = action.confirm === false
            ? null
            : (typeof action.confirm === 'string' ? action.confirm : `${action.label}?`)

        if (question === null) return runGuarded(action.onClick)
        setPending({ label: action.label, question, run: action.onClick })
    }

    const radius = flush ? 0 : 1

    // ── Confirm strip ─────────────────────────────────────────────────────────
    if (pending) {
        return (
            <Box sx={{ display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'flex-end',
                       flexWrap: 'wrap',
                       gap: 1,
                       flexShrink: 0 }}>
                <Typography variant="body2" sx={{ mr: 'auto', color: 'arc.onGlass' }}>
                    {pending.question}
                </Typography>

                <ButtonGroup className="glass-inner-engraved"
                             variant="text"
                             sx={{ borderRadius: radius, overflow: 'hidden' }}>
                    <Button onClick={() => setPending(null)} disabled={busy} sx={barButtonSx('quiet')}>
                        Cancel
                    </Button>
                    <Button onClick={() => runGuarded(pending.run)}
                            disabled={busy}
                            sx={barButtonSx('danger')}>
                        {busy ? 'Working…' : pending.label}
                    </Button>
                </ButtonGroup>
            </Box>
        )
    }

    // ── Normal bar ────────────────────────────────────────────────────────────
    return (
        <Box sx={{ display: 'flex',
                   alignItems: 'center',
                   // Wraps on a narrow overlay rather than pushing the bar wider than
                   // the dialog. Destructive actions stay on their own row when it does.
                   flexWrap: 'wrap',
                   gap: 1,
                   flexShrink: 0 }}>
            {allActions.map(action => (
                <Button key={action.label}
                        size="small"
                        variant="outlined"
                        disabled={busy || action.disabled}
                        onClick={() => handleAction(action)}
                        sx={{ color: action.destructive ? 'arc.dangerOnGlass' : 'arc.onGlass',
                              borderColor: action.destructive ? 'arc.dangerOnGlass' : 'arc.glassDivider',
                              '&:hover': {
                                  borderColor: action.destructive ? 'arc.dangerOnGlass' : 'arc.onGlassMuted',
                                  backgroundColor: 'arc.glassHover',
                              } }}>
                    {action.label}
                </Button>
            ))}

            {/* The gap that keeps destructive actions away from the corner. */}
            <Box sx={{ flex: 1, minWidth: 0 }} />

            <ButtonGroup className="glass-inner-engraved"
                         variant="text"
                         fullWidth={fullWidth}
                         sx={{ borderRadius: radius,
                               overflow: 'hidden',
                               // Takes the row to itself when the actions above wrapped.
                               ...(fullWidth ? { flex: '1 1 100%' } : {}) }}>
                <Button onClick={onDiscard} disabled={busy} sx={barButtonSx('quiet')}>
                    {discardLabel}
                </Button>
                {onSave && (
                    <Button onClick={() => runGuarded(onSave)}
                            disabled={busy}
                            sx={barButtonSx(saveDestructive ? 'danger' : 'primary')}>
                        {busy ? 'Saving…' : saveLabel}
                    </Button>
                )}
            </ButtonGroup>
        </Box>
    )
}

export default ArcActionBar

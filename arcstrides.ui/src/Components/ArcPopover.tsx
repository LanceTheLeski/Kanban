/**
 * ArcPopover
 *
 * Replaces: ArcPopover.razor + ArcPopover.cs
 *
 * The Blazor version was in a state of active rework — it started as a MudPopover,
 * was pivoting to MudMenu (see commented-out blocks), and had unresolved questions
 * in the comments about who should own close logic when multiple popovers exist.
 *
 * This React version makes the following deliberate decisions:
 *
 *  1. Uses MUI Popover (not Menu) because the content is arbitrary (ChildContent),
 *     not a list of MenuItems. MudMenu was a workaround in Blazor; in MUI the
 *     Popover is the correct primitive for this use case.
 *
 *  2. The trigger element (the button that opens the popover) is rendered by
 *     ArcPopover itself, matching the Blazor pattern where the component owns
 *     its own toggle button.
 *
 *  3. "Who closes other popovers" — the Blazor comment said this was a
 *     responsibility OUTSIDE the component. We honour that here: ArcPopover is
 *     fully self-contained (uncontrolled by default) but also accepts an optional
 *     `open` + `onClose` pair so a parent can control it externally if needed.
 */

import React from 'react'
import {
    Box,
    Button,
    ButtonGroup,
    Popover,
    type ButtonProps,
    type PopoverOrigin,
} from '@mui/material'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ArcPopoverProps {
    /** Text shown on the trigger button — mirrors PopoverBaseText */
    triggerLabel: string
    /** Content inside the popover — mirrors RenderFragment ChildContent */
    children?: React.ReactNode
    /** Async submit handler — mirrors OnSubmitAsync: Func<Task> */
    onSubmit?: () => Promise<void> | void
    /**
     * External open control (optional) — for the "parent knows when to close"
     * pattern noted in the Blazor comments.
     */
    open?: boolean
    onClose?: () => void
    /** Mirrors PopoverBaseMudSize */
    triggerSize?: ButtonProps['size']
    /** Mirrors PopoverBaseMudStyle — inline styles for the trigger button */
    triggerStyle?: React.CSSProperties
    /** Where the popover attaches to the trigger — mirrors AnchorOrigin */
    anchorOrigin?: PopoverOrigin
    /** Where the popover transforms from — mirrors TransformOrigin */
    transformOrigin?: PopoverOrigin
}

// ── Component ────────────────────────────────────────────────────────────────

export const ArcPopover: React.FC<ArcPopoverProps> = ({
    triggerLabel,
    children,
    onSubmit,
    open: controlledOpen,
    onClose: controlledOnClose,
    triggerSize = 'medium',
    triggerStyle,
    anchorOrigin = { vertical: 'center', horizontal: 'right' },
    transformOrigin = { vertical: 'bottom', horizontal: 'left' },
}) => {
    // Internal state for uncontrolled mode
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
    const [submitting, setSubmitting] = React.useState(false)

    // If a parent passes `open`, we operate in controlled mode
    const isControlled = controlledOpen !== undefined
    const isOpen = isControlled ? controlledOpen : Boolean(anchorEl)

    const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(e.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
        controlledOnClose?.()
    }

    const handleSubmit = async () => {
        if (!onSubmit) return
        setSubmitting(true)
        try {
            await onSubmit()
            handleClose()
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            {/* Trigger button — mirrors the MudButton that opens the MudMenu in the razor */}
            <Button
                onClick={handleOpen}
                size={triggerSize}
                style={triggerStyle}
                variant="text"
                sx={{
                    fontFamily: '"DM Mono", monospace',
                    fontWeight: 400,
                }}
            >
                {triggerLabel}
            </Button>

            <Popover
                open={isOpen}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={anchorOrigin}
                transformOrigin={transformOrigin}
                // OverflowBehavior.FlipAlways — MUI Popover flips automatically
                disableScrollLock
                slotProps={{
                    paper: {
                        className: 'glass',
                        sx: { overflow: 'visible' },
                    },
                }}
            >
                {/*
          MudStack Spacing="0" — Box with flex column layout, no gap between
          content and button group so the glass-inner-engraved bar looks flush.
        */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: 280,
                        maxWidth: '90vw',
                    }}
                >
                    {/* ChildContent */}
                    <Box sx={{ p: 2 }}>{children}</Box>

                    {/* MudButtonGroup Class="glass-inner-engraved" */}
                    <ButtonGroup
                        className="glass-inner-engraved"
                        variant="text"
                        fullWidth
                        sx={{ borderRadius: 0 }}
                    >
                        {onSubmit && (
                            <Button onClick={handleSubmit} disabled={submitting}>
                                {submitting ? 'Saving…' : 'Submit'}
                            </Button>
                        )}
                        <Button onClick={handleClose}>Discard</Button>
                    </ButtonGroup>
                </Box>
            </Popover>
        </>
    )
}

export default ArcPopover
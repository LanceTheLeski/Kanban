/**
 * ArcOverlay
 *
 * Replaces: ArcOverlay.razor + ArcOverlay.cs + IArcOverlay.cs
 *
 * Blazor had IArcOverlay as an interface that partial classes (like CreateCardOverlay)
 * implemented, giving them OpenOverlay() and CloseOverlay() methods. In React there is
 * no inheritance model for components. Instead:
 *
 *   - "open" state lives in the *parent* (controlled component pattern).
 *   - The parent passes `open` and `onClose` down, mirroring @bind-Open.
 *   - Overlay-specific submit logic stays in the parent as a callback prop (onSubmit).
 *
 * The IArcOverlay interface becomes the ArcOverlayProps TypeScript type exported below.
 * Any component that used to implement IArcOverlay simply renders <ArcOverlay> and
 * manages its own `open` state with useState().
 */

import React from 'react'
import {
    Backdrop,
    Box,
    Button,
    ButtonGroup,
    Fade,
    Modal,
    Paper,
} from '@mui/material'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ArcOverlayProps {
    /** Controls visibility — mirrors Blazor's @bind-Open */
    open: boolean
    /** Called when the overlay should close — mirrors OpenChanged EventCallback */
    onClose: () => void
    /** Content rendered inside the overlay — mirrors RenderFragment ChildContent */
    children?: React.ReactNode
    /**
     * Async submit handler — mirrors OnSubmitAsync: Func<Task>
     * If omitted, no Submit button is rendered (mirrors the null check in the razor).
     */
    onSubmit?: () => Promise<void> | void
    /** Optional width override for the inner Paper */
    width?: string | number
}

// ── Component ────────────────────────────────────────────────────────────────

export const ArcOverlay: React.FC<ArcOverlayProps> = ({
    open,
    onClose,
    children,
    onSubmit,
    width = 480,
}) => {
    const [submitting, setSubmitting] = React.useState(false)

    const handleSubmit = async () => {
        if (!onSubmit) return
        setSubmitting(true)
        try {
            await onSubmit()
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            closeAfterTransition
            slots={{ backdrop: Backdrop }}
            slotProps={{ backdrop: { timeout: 300 } }}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }}
        >
            <Fade in={open}>
                {/*
          MudPaper Class="glass" → Paper with className="glass"
          The glass class lives in ArcStyles.css and is applied globally.
        */}
                <Paper
                    className="glass"
                    sx={{
                        width,
                        maxWidth: '95vw',
                        maxHeight: '90vh',
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        // The Paper itself must not scroll: the content area below does,
                        // so the Submit/Discard group stays pinned and visible. Without
                        // this, tall content (the card overlay) squeezed the buttons to a
                        // few pixels and pushed them past the bottom of the screen.
                        overflow: 'hidden',
                        outline: 'none', // removes default Modal focus ring on the Paper
                    }}
                >
                    {/* ChildContent slot — minHeight:0 lets a flex child actually shrink */}
                    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{children}</Box>

                    {/*
            MudButtonGroup Class="glass-inner-engraved"
            Submit only rendered when onSubmit is provided — mirrors null check in razor.
          */}
                    <ButtonGroup
                        className="glass-inner-engraved"
                        variant="text"
                        sx={{ alignSelf: 'flex-end', flexShrink: 0, borderRadius: 1, overflow: 'hidden' }}
                    >
                        {onSubmit && (
                            <Button onClick={handleSubmit} disabled={submitting}>
                                {submitting ? 'Saving…' : 'Submit'}
                            </Button>
                        )}
                        <Button onClick={onClose}>Discard</Button>
                    </ButtonGroup>
                </Paper>
            </Fade>
        </Modal>
    )
}

export default ArcOverlay
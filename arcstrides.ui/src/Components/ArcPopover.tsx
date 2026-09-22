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
    Popover,
    type ButtonProps,
    type PopoverOrigin,
    type SxProps,
    type Theme,
} from '@mui/material'
import { MONO } from '../Styles/Fonts'
import { ArcActionBar, type ArcAction } from './ArcActionBar'
import { ArcTitleBar, type TitleStock } from './ArcTitleBar'
import { POPOVER_MIN_WIDTH } from '../Styles/Measures'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ArcPopoverProps {
    /** Text shown on the trigger button — mirrors PopoverBaseText */
    triggerLabel: string
    /** Content inside the popover — mirrors RenderFragment ChildContent */
    children?: React.ReactNode
    /**
     * Async submit handler — mirrors OnSubmitAsync: Func<Task>
     *
     * Return `false` to keep the popover open, for a save that did not happen.
     * Anything else (including nothing) closes it, which is what every existing
     * caller relied on.
     */
    onSubmit?: () => Promise<boolean | void> | boolean | void
    /**
     * External open control (optional) — for the "parent knows when to close"
     * pattern noted in the Blazor comments.
     */
    open?: boolean
    onClose?: () => void
    /** Mirrors PopoverBaseMudSize */
    triggerSize?: ButtonProps['size']
    /**
     * Styling for the trigger button.
     *
     * `sx`, not the inline `style` this used to take. Inline styles cannot use
     * theme paths, so a caller passing a palette path — which UpdateTaskPopover
     * did — was handing the DOM a string that is not a colour, and the browser
     * dropped it. The task rows had been silently unstyled ever since the
     * palette moved into the theme.
     */
    triggerSx?: SxProps<Theme>
    /**
     * A class for the trigger button — in practice one of the card stocks, for
     * the triggers that are pieces of card rather than text on a pane.
     *
     * Separate from triggerSx because the stock is carried by plain CSS custom
     * properties, and this app's stylesheet deliberately wins over sx at equal
     * specificity; trying to say the same thing through sx would be overridden.
     */
    triggerClassName?: string
    /**
     * Styling for the trigger while the popover is open, on top of triggerSx.
     *
     * The marker below says *that* a trigger is open; this says what that looks
     * like on the ground the trigger happens to be standing on. A marker is a
     * change in contrast, and which direction contrast goes depends on what is
     * underneath: the task rows are card stock, so theirs darkens, and "+ New
     * task" sits on the glass tray, so its lightens. This component cannot see
     * its ground, so it does not guess.
     *
     * It used to guess. The default was a white fill and a 95% white label,
     * which was right for glass and, once the task rows became card, rendered
     * the open row's title white on off-white.
     */
    triggerOpenSx?: SxProps<Theme>
    /** The popover's heading, as a strip of card across the top. */
    title?: React.ReactNode
    /** Which stock the title strip is cut from. See ArcTitleBar. */
    titleStock?: TitleStock
    /** Where the popover attaches to the trigger — mirrors AnchorOrigin */
    anchorOrigin?: PopoverOrigin
    /** Where the popover transforms from — mirrors TransformOrigin */
    transformOrigin?: PopoverOrigin

    // ── Action bar ───────────────────────────────────────────────────────────
    // The same bar an overlay gets, so a popover's controls sit where an
    // overlay's do. See ArcActionBar.
    onDelete?: () => Promise<void> | void
    deleteLabel?: string
    deleteConfirm?: string
    actions?: ArcAction[]
    submitLabel?: string
    /** Colours the primary action as destructive. */
    submitDestructive?: boolean
}

// ── Component ────────────────────────────────────────────────────────────────

export const ArcPopover: React.FC<ArcPopoverProps> = ({
    triggerLabel,
    children,
    onSubmit,
    open: controlledOpen,
    onClose: controlledOnClose,
    triggerSize = 'medium',
    triggerSx,
    triggerClassName,
    triggerOpenSx,
    title,
    titleStock,
    anchorOrigin = { vertical: 'center', horizontal: 'right' },
    transformOrigin = { vertical: 'bottom', horizontal: 'left' },
    onDelete,
    deleteLabel,
    deleteConfirm,
    actions,
    submitLabel,
    submitDestructive,
}) => {
    // Internal state for uncontrolled mode
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)

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

    // Unlike the overlay, a popover closes itself on a successful submit — it has
    // no backdrop, so leaving it open over the thing it just changed reads as the
    // save not having happened. ArcActionBar owns the busy state either way.
    /*
       Closes on success only.

       It used to close unconditionally, which was survivable while nothing
       depended on the popover's draft surviving. It is not any more: the task
       popover reverts its draft when it closes, so a rejected save would have
       closed the popover *and* silently thrown away what the user typed, leaving
       only a snackbar to explain it.
    */
    const handleSubmit = onSubmit
        ? async () => {
            const succeeded = await onSubmit()
            if (succeeded !== false) handleClose()
        }
        : undefined

    return (
        <>
            {/* Trigger button — mirrors the MudButton that opens the MudMenu in the razor */}
            <Button onClick={handleOpen}
                    size={triggerSize}
                    variant="text"
                    className={triggerClassName}
                    aria-expanded={isOpen}
                    sx={{ fontFamily: MONO,
                          fontWeight: 400,
                          textTransform: 'none',
                          ...triggerSx,
                          /*
                             While the popover is open the trigger says so. Without it,
                             a popover anchored beside a list of near-identical rows
                             gives no clue which row it belongs to — you have to
                             remember what you clicked. The marker is a bar down the
                             leading edge plus a lift in the ground, which reads at a
                             glance without moving anything.

                             Only the half that holds on any ground is here: the bar
                             and the weight. The fill and the label colour come from
                             the caller, which is the only party that knows what the
                             trigger is sitting on — see triggerOpenSx.

                             After the spread, so it wins over a caller's own styling
                             rather than being overwritten by it.
                          */
                          ...(isOpen
                              ? {
                                  fontWeight: 700,
                                  boxShadow: 'inset 3px 0 0 0 var(--arc-accent-on-glass)',
                                  ...(triggerOpenSx as object),
                              }
                              : {}) }}>
                {triggerLabel}
            </Button>

            <Popover open={isOpen}
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
                     }}>
                {/*
          MudStack Spacing="0" — Box with flex column layout, no gap between
          content and button group so the glass-inner-engraved bar looks flush.
        */}
                <Box sx={{ display: 'flex',
                           flexDirection: 'column',
                           minWidth: POPOVER_MIN_WIDTH,
                           maxWidth: '90vw' }}>
                    {/* ChildContent */}
                    <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {title && <ArcTitleBar stock={titleStock}>{title}</ArcTitleBar>}
                        {children}
                    </Box>

                    {/* Mirrors MudButtonGroup Class="glass-inner-engraved".
                        `flush` because the bar sits against the popover's own edge
                        with no padding around it to round into. */}
                    {/*
                        The same bar an overlay gets, laid out the same way: the
                        pair sits at the trailing edge with the actions away from
                        it, rather than two stretched buttons filling the width.
                        `fullWidth` was the difference, and it made a popover's
                        controls a different shape from every other surface's.
                    */}
                    <Box sx={{ px: 2, pb: 1.5, pt: 0.5 }}>
                        <ArcActionBar onSave={handleSubmit}
                                      onDiscard={handleClose}
                                      saveLabel={submitLabel}
                                      saveDestructive={submitDestructive}
                                      onDelete={onDelete}
                                      deleteLabel={deleteLabel}
                                      deleteConfirm={deleteConfirm}
                                      actions={actions} />
                    </Box>
                </Box>
            </Popover>
        </>
    )
}

export default ArcPopover
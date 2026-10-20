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
 *
 * ── Save only when there is something to save ────────────────────────────────
 * An overlay with a Save shows it only while something in it has changed: an
 * edit made, a field filled, a thing chosen to delete. Until then its one
 * button is Close; after, Discard and Save. So Save never offers to write
 * nothing, and Discard never asks about a draft that does not exist. Each
 * overlay says what counts as a change, through `dirty` — which the types
 * require wherever there is an `onSubmit`, so no overlay can leave it out. The
 * day overlay worked this way first; the card editor always showed Save.
 * ArcPopover does the same.
 */

import React from 'react'
import { Backdrop, Box, Fade, Modal, Paper } from '@mui/material'
import { ArcActionBar, type ArcAction } from './ArcActionBar'
import { ArcTitleBar, type TitleStock } from './ArcTitleBar'
import { OVERLAY_WIDTH } from '../Styles/Measures'

// ── Types ────────────────────────────────────────────────────────────────────

export type ArcOverlayProps = OverlayProps & SubmitProps

/**
 * A Save, and whether there is anything for it to write — see the header. Both
 * or neither: an overlay with a Save has to say when it has a change.
 */
export type SubmitProps =
    | { onSubmit?: undefined; dirty?: undefined }
    | {
        /**
         * Async submit handler — mirrors OnSubmitAsync: Func<Task>. Rendered as
         * Save only while `dirty`.
         */
        onSubmit: () => Promise<void> | void

        /** Something in the overlay has changed, and Save would write it. */
        dirty: boolean
    }

interface OverlayProps
{
    /**
     * The dialog's heading, as a strip of card across the top.
     *
     * Optional because UpdateCardOverlay does not take one: its first row is the
     * card's own title in an editable field, which is a better heading than any
     * fixed string, and a strip above it would be the same duplication this prop
     * exists to remove everywhere else.
     */
    title?: React.ReactNode

    /** Which stock the title strip is cut from. See ArcTitleBar. */
    titleStock?: TitleStock

    /** A second line under the title, for a hint the fields cannot carry. */
    titleCaption?: React.ReactNode

    /** Controls visibility — mirrors Blazor's @bind-Open */
    open: boolean

    /** Called when the overlay should close — mirrors OpenChanged EventCallback */
    onClose: () => void

    /** Content rendered inside the overlay — mirrors RenderFragment ChildContent */
    children?: React.ReactNode

    /** Optional width override for the inner Paper */
    width?: string | number

    // ── Action bar ───────────────────────────────────────────────────────────
    // Passed straight through to ArcActionBar, which owns the bottom-right
    // corner for every overlay. See that file for why Delete sits at the far
    // left rather than beside Save.
    /** Renders a Delete at the leading edge, with a confirmation step. */
    onDelete?: () => Promise<void> | void

    deleteLabel?: string

    deleteConfirm?: string

    /** Anything beyond Delete. */
    actions?: ArcAction[]

    /** "Save" by default. */
    submitLabel?: string

    /** Colours the primary action as destructive. */
    submitDestructive?: boolean
}

// ── Component ────────────────────────────────────────────────────────────────

export const ArcOverlay: React.FC<ArcOverlayProps> = ({
    open,
    onClose,
    children,
    title,
    titleStock,
    titleCaption,
    onSubmit,
    dirty = false,
    width = OVERLAY_WIDTH,
    onDelete,
    deleteLabel,
    deleteConfirm,
    actions,
    submitLabel,
    submitDestructive,
}) =>
{
    // Save while there is a change to save; Discard then, Close otherwise.
    const saving = onSubmit !== undefined && dirty

    return (
        <Modal open={open}
               onClose={onClose}
               closeAfterTransition
               slots={{ backdrop: Backdrop }}
               slotProps={{ backdrop: { timeout: 300 } }}
               sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }}>
            <Fade in={open}>
                {/*
          MudPaper Class="glass" → Paper with className="glass"
          The glass class lives in ArcStyles.css and is applied globally.
        */}
                <Paper className="glass"
                       sx={{ width,
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
                             // Removes the Modal's default focus ring on the Paper.
                             outline: 'none'
                          }}>
                    { title && <ArcTitleBar stock={titleStock} caption={titleCaption}>{ title }</ArcTitleBar> }

                    {/* ChildContent slot — minHeight:0 lets a flex child actually shrink */}
                    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{ children }</Box>

                    {/*
                        Mirrors MudButtonGroup Class="glass-inner-engraved". Save is
                        only rendered while there is a change — see the header.
                    */}
                    <ArcActionBar onSave={saving
                                      ? onSubmit
                                      : undefined}
                                  onDiscard={onClose}
                                  discardLabel={saving
                                      ? 'Discard'
                                      : 'Close'}
                                  saveLabel={submitLabel}
                                  saveDestructive={submitDestructive}
                                  onDelete={onDelete}
                                  deleteLabel={deleteLabel}
                                  deleteConfirm={deleteConfirm}
                                  actions={actions} />
                </Paper>
            </Fade>
        </Modal>
    )
}

export default ArcOverlay
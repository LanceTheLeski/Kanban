/**
 * BoardManagementNav
 *
 * Mirrors: Board/BoardManagementNavigationBar.razor
 *
 * ── @ref elimination ─────────────────────────────────────────────────────────
 * Blazor held private field references to each overlay child:
 *   private CreateCardOverlay createCardOverlay;
 *   // ...
 *   <MudMenuItem OnClick="createCardOverlay.OpenOverlay">Add</MudMenuItem>
 *
 * This was an imperative pattern: parent reaches into child and calls a method.
 * React uses the controlled component pattern instead: parent owns a boolean per
 * overlay and passes open/onClose props. Each menu item just sets its boolean.
 *
 * ── Why local useState, not Zustand ──────────────────────────────────────────
 * Overlay open/close state is ephemeral UI state — it means nothing outside this
 * component, nothing else in the app needs to know a modal is open, and it dies
 * when the component unmounts. Zustand is for server-derived data that needs to
 * be shared or outlive components. See boardStore.ts for that data.
 *
 * ── Column/Swimlane data ─────────────────────────────────────────────────────
 * In Blazor, columns and swimlanes were passed as @bind- parameters and piped
 * through to each overlay. Here the overlays read from the Zustand store directly,
 * so BoardManagementNav doesn't need to pass them down at all.
 * boardId is still a prop since this component renders in context of a specific board.
 *
 * ── MenuOverlay ──────────────────────────────────────────────────────────────
 * Blazor's <MenuOverlay /> was a navigation sidebar. Stubbed here until
 * the layout feature is built.
 */

import React, { useState } from 'react'
import {
    AppBar,
    Box,
    Button,
    Menu,
    MenuItem,
    Toolbar,
    Typography,
} from '@mui/material'
import { CreateCardOverlay } from './card/CreateCardOverlay'
import { CreateColumnOverlay } from './column/CreateColumnOverlay'
import { DeleteColumnOverlay } from './column/DeleteColumnOverlay'
import { UpdateColumnOverlay } from './column/UpdateColumnOverlay'
import { CreateSwimlaneOverlay } from './swimlane/CreateSwimlaneOverlay'
import { DeleteSwimlaneOverlay } from './swimlane/DeleteSwimlaneOverlay'
import { UpdateSwimlaneOverlay } from './swimlane/UpdateSwimlaneOverlay'

// ── Menu state helper ─────────────────────────────────────────────────────────

/**
 * Encapsulates the anchorEl state for a single MUI Menu.
 * Avoids repeating the open/close pattern for each toolbar dropdown.
 */
function useMenuState() {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null)
    return {
        anchor,
        open: Boolean(anchor),
        handleOpen: (e: React.MouseEvent<HTMLButtonElement>) => setAnchor(e.currentTarget),
        handleClose: () => setAnchor(null),
    }
}

// ── Component ─────────────────────────────────────────────────────────────────

export const BoardManagementNav: React.FC = () => {
    // ── Overlay open flags — each mirrors a private @ref field in Blazor ─────────
    const [createCardOpen, setCreateCardOpen] = useState(false)
    const [createColumnOpen, setCreateColumnOpen] = useState(false)
    const [updateColumnOpen, setUpdateColumnOpen] = useState(false)
    const [deleteColumnOpen, setDeleteColumnOpen] = useState(false)
    const [createSwimlaneOpen, setCreateSwimlaneOpen] = useState(false)
    const [updateSwimlaneOpen, setUpdateSwimlaneOpen] = useState(false)
    const [deleteSwimlaneOpen, setDeleteSwimlaneOpen] = useState(false)

    // ── Toolbar dropdown menus ────────────────────────────────────────────────────
    const cardsMenu = useMenuState()
    const swimlanesMenu = useMenuState()
    const columnsMenu = useMenuState()
    const boardsMenu = useMenuState()

    return (
        <>
            {/* ── Toolbar — mirrors MudToolBar with MudPaper Elevation=25 ─────── */}
            <AppBar
                position="static"
                elevation={25}
                sx={{ backgroundColor: 'primary.main' }}
            >
                <Toolbar variant="dense" sx={{ gap: 2 }}>

                    {/* MenuOverlay placeholder — mirrors Blazor's <MenuOverlay /> */}
                    <Box sx={{ mr: 2 }}>
                        <Typography variant="caption" sx={{ opacity: 0.6 }}>[Menu]</Typography>
                    </Box>

                    {/* ── Cards menu ─────────────────────────────────────────────────── */}
                    <Button color="inherit" onClick={cardsMenu.handleOpen}>Cards</Button>
                    <Menu anchorEl={cardsMenu.anchor} open={cardsMenu.open} onClose={cardsMenu.handleClose}>
                        <MenuItem onClick={() => { setCreateCardOpen(true); cardsMenu.handleClose() }}>
                            Add
                        </MenuItem>
                    </Menu>

                    {/* ── Swimlanes menu ──────────────────────────────────────────────── */}
                    <Button color="inherit" onClick={swimlanesMenu.handleOpen}>Swimlanes</Button>
                    <Menu anchorEl={swimlanesMenu.anchor} open={swimlanesMenu.open} onClose={swimlanesMenu.handleClose}>
                        <MenuItem onClick={() => { setCreateSwimlaneOpen(true); swimlanesMenu.handleClose() }}>Add</MenuItem>
                        <MenuItem onClick={() => { setUpdateSwimlaneOpen(true); swimlanesMenu.handleClose() }}>Edit</MenuItem>
                        <MenuItem onClick={() => { setDeleteSwimlaneOpen(true); swimlanesMenu.handleClose() }}>Delete</MenuItem>
                    </Menu>

                    {/* ── Columns menu ────────────────────────────────────────────────── */}
                    <Button color="inherit" onClick={columnsMenu.handleOpen}>Columns</Button>
                    <Menu anchorEl={columnsMenu.anchor} open={columnsMenu.open} onClose={columnsMenu.handleClose}>
                        <MenuItem onClick={() => { setCreateColumnOpen(true); columnsMenu.handleClose() }}>Add</MenuItem>
                        <MenuItem onClick={() => { setUpdateColumnOpen(true); columnsMenu.handleClose() }}>Edit</MenuItem>
                        <MenuItem onClick={() => { setDeleteColumnOpen(true); columnsMenu.handleClose() }}>Delete</MenuItem>
                    </Menu>

                    {/* ── Boards menu ─────────────────────────────────────────────────── */}
                    <Button color="inherit" onClick={boardsMenu.handleOpen}>Boards</Button>
                    <Menu anchorEl={boardsMenu.anchor} open={boardsMenu.open} onClose={boardsMenu.handleClose}>
                        <MenuItem onClick={boardsMenu.handleClose}>Edit</MenuItem>
                    </Menu>

                </Toolbar>
            </AppBar>

            {/* ── Overlays — rendered outside the toolbar, no DOM nesting issues ── */}
            <CreateCardOverlay open={createCardOpen} onClose={() => setCreateCardOpen(false)} />
            <CreateColumnOverlay open={createColumnOpen} onClose={() => setCreateColumnOpen(false)} />
            <UpdateColumnOverlay open={updateColumnOpen} onClose={() => setUpdateColumnOpen(false)} />
            <DeleteColumnOverlay open={deleteColumnOpen} onClose={() => setDeleteColumnOpen(false)} />
            <CreateSwimlaneOverlay open={createSwimlaneOpen} onClose={() => setCreateSwimlaneOpen(false)} />
            <UpdateSwimlaneOverlay open={updateSwimlaneOpen} onClose={() => setUpdateSwimlaneOpen(false)} />
            <DeleteSwimlaneOverlay open={deleteSwimlaneOpen} onClose={() => setDeleteSwimlaneOpen(false)} />
        </>
    )
}

export default BoardManagementNav
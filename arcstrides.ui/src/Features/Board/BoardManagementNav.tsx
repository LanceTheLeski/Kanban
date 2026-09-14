/**
 * BoardManagementNav
 *
 * Mirrors: Board/BoardManagementNavigationBar.razor
 *
 * ── It stays a nav bar ───────────────────────────────────────────────────────
 * It is one: a bar of menus that act on the board. What was worth pulling apart
 * was not the bar but the bookkeeping around it — seven booleans and four
 * anchor-element pairs, each declared, set and rendered by hand.
 *
 * ── Why one key instead of seven booleans ────────────────────────────────────
 * Seven independent booleans describe 128 states. Seven of them are reachable by
 * design and one more is meaningful (all false); the other 120 are nonsense —
 * "Add Column and Delete Swimlane are both open" is not a thing this bar can
 * mean, but it was a thing its state could say. Nothing enforced that; it held
 * only because each menu item happened to set one flag and each overlay happened
 * to clear the same one.
 *
 * One `OverlayKey | null` says exactly what is true: at most one overlay is
 * open, and which. The invariant is now structural rather than maintained.
 *
 * The four menus get the same treatment for the same reason — MUI menus are
 * modal, so two were never open at once regardless.
 *
 * ── Why a registry and a descriptor ──────────────────────────────────────────
 * The menu structure was fourteen lines of near-identical JSX per menu, where
 * the only things that varied were a label, an item label and which flag to set.
 * That is data, so it is written as data: MENUS below reads as the bar's
 * contents, and adding an item is a line in a list rather than a new boolean, a
 * new MenuItem and a new element at the bottom of the file.
 *
 * ── @ref elimination (unchanged from the conversion) ─────────────────────────
 * Blazor held private field references to each overlay child and called methods
 * on them: `<MudMenuItem OnClick="createCardOverlay.OpenOverlay">`. React uses
 * the controlled pattern instead — the parent owns the state and passes
 * open/onClose down. That is what makes a registry possible at all.
 *
 * ── Why local useState, not Zustand ──────────────────────────────────────────
 * Which overlay is open is ephemeral UI state: it means nothing outside this
 * component, nothing else in the app needs to know, and it dies with the
 * component. Zustand is for server-derived data that is shared or outlives a
 * component. See Board.Store.ts for that.
 *
 * ── Column/Swimlane data ─────────────────────────────────────────────────────
 * In Blazor, columns and swimlanes were passed as @bind- parameters and piped
 * through to each overlay. Here the overlays read from the store directly, so
 * this bar passes nothing down — which is the other reason the registry works:
 * every overlay takes the same two props.
 */

import React, { useState } from 'react'
import { AppBar, Box, Button, Menu, MenuItem, Toolbar, Typography } from '@mui/material'
import { CreateCardOverlay } from './Card/CreateCardOverlay'
import { CreateColumnOverlay } from './Column/CreateColumnOverlay'
import { DeleteColumnOverlay } from './Column/DeleteColumnOverlay'
import { UpdateColumnOverlay } from './Column/UpdateColumnOverlay'
import { CreateSwimlaneOverlay } from './Swimlane/CreateSwimlaneOverlay'
import { DeleteSwimlaneOverlay } from './Swimlane/DeleteSwimlaneOverlay'
import { UpdateSwimlaneOverlay } from './Swimlane/UpdateSwimlaneOverlay'

// ── The overlays this bar can open ────────────────────────────────────────────

/**
 * Every overlay reachable from the bar takes exactly these props, which is what
 * lets them be held in one table and rendered through one element.
 */
type OverlayComponent = React.FC<{ open: boolean; onClose: () => void }>

/**
 * Spelled out rather than derived from the table below with `keyof typeof`.
 * Written this way round, `Record<OverlayKey, …>` checks both directions: a key
 * here with no entry in the table is an error, and an entry in the table with no
 * key here is an error too. Derivation would only have caught the second.
 */
type OverlayKey =
    | 'createCard'
    | 'createColumn'
    | 'updateColumn'
    | 'deleteColumn'
    | 'createSwimlane'
    | 'updateSwimlane'
    | 'deleteSwimlane'

const OVERLAYS: Record<OverlayKey, OverlayComponent> = {
    createCard: CreateCardOverlay,
    createColumn: CreateColumnOverlay,
    updateColumn: UpdateColumnOverlay,
    deleteColumn: DeleteColumnOverlay,
    createSwimlane: CreateSwimlaneOverlay,
    updateSwimlane: UpdateSwimlaneOverlay,
    deleteSwimlane: DeleteSwimlaneOverlay,
}

// ── What the bar contains ─────────────────────────────────────────────────────

interface MenuItemSpec {
    label: string
    /** Omitted for an item whose overlay is not ported yet — see Boards, below. */
    overlay?: OverlayKey
}

interface MenuSpec {
    label: string
    items: MenuItemSpec[]
}

const MENUS: MenuSpec[] = [
    {
        label: 'Cards',
        items: [{ label: 'Add', overlay: 'createCard' }],
    },
    {
        label: 'Swimlanes',
        items: [
            { label: 'Add', overlay: 'createSwimlane' },
            { label: 'Edit', overlay: 'updateSwimlane' },
            { label: 'Delete', overlay: 'deleteSwimlane' },
        ],
    },
    {
        label: 'Columns',
        items: [
            { label: 'Add', overlay: 'createColumn' },
            { label: 'Edit', overlay: 'updateColumn' },
            { label: 'Delete', overlay: 'deleteColumn' },
        ],
    },
    {
        // AddManageBoardOverlay has not been converted from Blazor yet, so this
        // item closes the menu and does nothing — the same as it did before,
        // now visible as a missing `overlay` rather than a handler that only
        // calls handleClose.
        label: 'Boards',
        items: [{ label: 'Edit' }],
    },
]

// ── Component ─────────────────────────────────────────────────────────────────

export const BoardManagementNav: React.FC = () => {
    const [openOverlay, setOpenOverlay] = useState<OverlayKey | null>(null)

    // Which menu is dropped down, and from what. One piece of state rather than
    // four, because MUI menus are modal — two were never open together anyway.
    const [openMenu, setOpenMenu] = useState<{ label: string; anchor: HTMLElement } | null>(null)

    const closeMenu = () => setOpenMenu(null)

    const handleItemClick = (item: MenuItemSpec) => {
        closeMenu()
        if (item.overlay) setOpenOverlay(item.overlay)
    }

    const OpenOverlay = openOverlay ? OVERLAYS[openOverlay] : null

    return (
        <>
            {/* Mirrors MudToolBar inside MudPaper Elevation=25.
                MudPaper Elevation="25" has no MUI equivalent — the theme's shadow
                scale stops at 24, and anything past it renders no shadow at all
                and logs a warning. 24 is the deepest MUI offers. */}
            <AppBar position="static" elevation={24} sx={{ backgroundColor: 'primary.main' }}>
                {/*
                    The toolbar wraps rather than overflowing. Its buttons are words,
                    not icons, so below roughly 400px the four menus plus the [Menu]
                    slot are wider than the bar — and a nowrap toolbar does not clip
                    politely, it pushes the AppBar's scrollWidth past its own box.
                    Wrapping costs a second row on a phone and nothing anywhere else.
                */}
                <Toolbar variant="dense" sx={{ gap: 2, flexWrap: 'wrap', rowGap: 0.5, py: 0.5 }}>
                    {/* MenuOverlay placeholder — mirrors Blazor's <MenuOverlay /> */}
                    <Box sx={{ mr: 2 }}>
                        <Typography variant="caption" sx={{ opacity: 0.6 }}>[Menu]</Typography>
                    </Box>

                    {MENUS.map(menu => (
                        <React.Fragment key={menu.label}>
                            <Button
                                color="inherit"
                                onClick={event =>
                                    setOpenMenu({ label: menu.label, anchor: event.currentTarget })
                                }
                            >
                                {menu.label}
                            </Button>

                            <Menu
                                anchorEl={openMenu?.anchor ?? null}
                                open={openMenu?.label === menu.label}
                                onClose={closeMenu}
                            >
                                {menu.items.map(item => (
                                    <MenuItem key={item.label} onClick={() => handleItemClick(item)}>
                                        {item.label}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </React.Fragment>
                    ))}
                </Toolbar>
            </AppBar>

            {/*
                The one open overlay, rendered outside the toolbar so there are no
                DOM nesting issues. Mounted only while open, so an overlay's draft
                state starts fresh each time it is opened rather than carrying over
                from the last time it was dismissed.
            */}
            {OpenOverlay && <OpenOverlay open onClose={() => setOpenOverlay(null)} />}
        </>
    )
}

export default BoardManagementNav

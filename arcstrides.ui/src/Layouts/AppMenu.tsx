/**
 * AppMenu
 *
 * The Honu button at the left of every page's bar, and the menu of pages it
 * opens.
 *
 * Mirrors: Layouts/MenuOverlay.razor — a 30px round button with Honu.png on it
 * and no click handler. The React board showed "[Menu]" in its place.
 *
 * ── Why it lives in Layouts ──────────────────────────────────────────────────
 * It knows the app's routes, which no feature should: a feature that links to
 * another feature's page has to know that page exists. So the bars take it as a
 * slot, and the pages — which sit above both — fill the slot with this.
 */

import React, { useState } from 'react'
import { ButtonBase, Menu, MenuItem } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'

export const AppMenu: React.FC = () => {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null)
    const navigate = useNavigate()
    const { pathname } = useLocation()

    const go = (to: string) => {
        setAnchor(null)
        navigate(to)
    }

    return (
        <>
            {/*
                A disc of card with the turtle printed on it, rather than the
                image laid straight onto the bar's blue — the bar is the one
                strip the app bar paints, and a sticker reads as a thing on it.
            */}
            <ButtonBase className="card-disc card-stock-flat"
                        onClick={event => setAnchor(event.currentTarget)}
                        aria-label="Open the app menu"
                        aria-haspopup="menu"
                        aria-expanded={anchor !== null}
                        sx={{ width: 34,
                              height: 34,
                              flexShrink: 0,
                              '&:hover': { filter: 'brightness(0.96)' },
                              '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'common.white', outlineOffset: 2 } }}>
                <img src="/Honu.png" alt="" width={26} height={26} />
            </ButtonBase>

            <Menu anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
                {PAGES.map(page => (
                    <MenuItem key={page.to} selected={page.isHere(pathname)} onClick={() => go(page.to)}>
                        {page.label}
                    </MenuItem>
                ))}
            </Menu>
        </>
    )
}

export default AppMenu

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/**
 * The pages. "Board" goes to the root, which redirects to the demo board until
 * there is a board picker to go to instead — see App.tsx.
 */
const PAGES = [
    { label: 'Board', to: '/', isHere: (path: string) => path.startsWith('/board') },
    { label: 'Calendar', to: '/calendar', isHere: (path: string) => path.startsWith('/calendar') },
]

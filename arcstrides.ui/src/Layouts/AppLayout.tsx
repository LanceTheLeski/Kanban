/**
 * AppLayout
 *
 * Mirrors: Layouts/MainLayout.razor
 *
 * The Blazor layout wrapped every page in `<div class="page">` and swapped its
 * background image on each navigation, via a NavigationManager.LocationChanged
 * subscription calling UpdateBackground(). React Router gives us the same signal
 * declaratively through useLocation(), so no subscription or manual
 * StateHasChanged() is needed.
 *
 * MainLayout also mounted MudBlazor's four providers (Theme, Popover, Dialog,
 * Snackbar). Their React counterparts live in App.tsx — ThemeProvider,
 * CssBaseline and ArcErrorDisplay — because MUI's Popover and Dialog portal
 * themselves and need no app-level provider.
 *
 * The Blazor `#blazor-error-ui` bar has no equivalent: React surfaces failures
 * through the snackbar (see useBoardActions) and the board's own error state.
 */

import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'

/**
 * Route → background image. Mirrors the switch in MainLayout.UpdateBackground().
 * Files live in public/ and are copied from ArcStrides.UI.Legacy/wwwroot/.
 */
function backgroundFor(pathname: string): string {
    if (pathname.startsWith('/calendar')) return 'CalendarBackground3.jpg'
    return 'DefaultBackground5.jpg'
}

export const AppLayout: React.FC = () => {
    const { pathname } = useLocation()

    return (
        <div
            className="page"
            style={{ ['--arc-page-background' as string]: `url('/${backgroundFor(pathname)}')` }}
        >
            <main>
                <Outlet />
            </main>
        </div>
    )
}

export default AppLayout

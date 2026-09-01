/**
 * ArcErrorDisplay
 *
 * Replaces: ArcErrorHandler.cs + IArcErrorHandler.cs
 *
 * The Blazor version injected ISnackbar from MudBlazor and called
 * _snackbar.Add(displayMessage) from a service class. This was wired up
 * through DI so any class could call it.
 *
 * In React, there is no DI container. The notistack library provides an
 * identical pattern:
 *
 *   Blazor:  _snackbar.Add("message")
 *   React:   enqueueSnackbar("message", { variant: 'error' })
 *
 * The pair is:
 *
 *  1. ArcErrorDisplay — the provider wrapper that must live near the root of
 *     the app (just like MudSnackbarProvider in MainLayout.razor).
 *     Configured to match: PositionClass = TopCenter, MaxDisplayedSnackbars = 5,
 *     SnackbarVariant = Filled, PreventDuplicates = true.
 *
 *  2. useArcError — the consumer side, which lives in Components/useArcError.ts.
 *     Components call that instead of injecting IArcErrorHandler.
 */

import React from 'react'
import { SnackbarProvider, type SnackbarProviderProps } from 'notistack'

// ── Provider ─────────────────────────────────────────────────────────────────

interface ArcErrorDisplayProps {
    children: React.ReactNode
}

/**
 * Drop this at your app root in place of:
 *   <MudSnackbarProvider /> (in MainLayout.razor)
 *   Snackbar.Configuration.PositionClass = TopCenter (in MyMudProviders.razor)
 */
export const ArcErrorDisplay: React.FC<ArcErrorDisplayProps> = ({ children }) => {
    const snackbarProps: SnackbarProviderProps = {
        // Snackbar.Configuration.PositionClass = Defaults.Classes.Position.TopCenter
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        // Snackbar.Configuration.MaxDisplayedSnackbars = 5
        maxSnack: 5,
        // Snackbar.Configuration.SnackbarVariant = Variant.Filled — notistack has no
        // separate "filled" variant; its default snackbar is already filled, and the
        // per-call variant ('error'/'success'/'info') picks the colour.
        // Snackbar.Configuration.PreventDuplicates = true
        preventDuplicate: true,
        // Auto-dismiss after 4 seconds
        autoHideDuration: 4000,
    }

    return <SnackbarProvider {...snackbarProps}>{children}</SnackbarProvider>
}

export default ArcErrorDisplay

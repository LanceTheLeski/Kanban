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
 * This file exports two things:
 *
 *  1. ArcErrorDisplay — the provider wrapper that must live near the root of
 *     the app (just like MudSnackbarProvider in MainLayout.razor).
 *     Configured to match: PositionClass = TopCenter, MaxDisplayedSnackbars = 5,
 *     SnackbarVariant = Filled, PreventDuplicates = true.
 *
 *  2. useArcError — a custom hook that returns an addError() function matching
 *     the IArcErrorHandler interface exactly:
 *
 *       addError(message: string, errorCode?: number | HttpStatusCode)
 *
 *     This hook is what components use instead of injecting IArcErrorHandler.
 */

import React from 'react'
import { SnackbarProvider, useSnackbar, type SnackbarProviderProps } from 'notistack'

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
        // Snackbar.Configuration.SnackbarVariant = Variant.Filled
        variant: 'filled',
        // Snackbar.Configuration.PreventDuplicates = true
        preventDuplicate: true,
        // Auto-dismiss after 4 seconds
        autoHideDuration: 4000,
    }

    return <SnackbarProvider {...snackbarProps}>{children}</SnackbarProvider>
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useArcError
 *
 * Returns an addError function that mirrors IArcErrorHandler exactly:
 *
 *   // Blazor:
 *   public void AddError(string message, HttpStatusCode? errorCode)
 *   public void AddError(string errorMessage, int? errorCode)
 *
 *   // React:
 *   const { addError } = useArcError()
 *   addError('Not found', 404)
 *   addError('Something went wrong')
 *
 * Must be called inside a component that is a descendant of <ArcErrorDisplay>.
 */
export const useArcError = () => {
    const { enqueueSnackbar } = useSnackbar()

    const addError = React.useCallback(
        (message: string, errorCode?: number | null) => {
            // Mirrors: var displayMessage = errorCode.HasValue ?
            //   $"{errorCode}: {errorMessage}" : $"{errorMessage}";
            const displayMessage =
                errorCode != null ? `${errorCode}: ${message}` : message

            enqueueSnackbar(displayMessage, { variant: 'error' })
        },
        [enqueueSnackbar]
    )

    /**
     * addInfo / addSuccess — not in the original IArcErrorHandler but included
     * here since the snackbar is the only notification mechanism in the app and
     * you will likely need these for success feedback on overlay submits.
     */
    const addSuccess = React.useCallback(
        (message: string) => {
            enqueueSnackbar(message, { variant: 'success' })
        },
        [enqueueSnackbar]
    )

    const addInfo = React.useCallback(
        (message: string) => {
            enqueueSnackbar(message, { variant: 'info' })
        },
        [enqueueSnackbar]
    )

    return { addError, addSuccess, addInfo }
}

export default ArcErrorDisplay
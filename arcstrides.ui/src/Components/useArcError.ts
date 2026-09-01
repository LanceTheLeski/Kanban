/**
 * useArcError
 *
 * Replaces: IArcErrorHandler.cs (the consumer half of ArcErrorHandler).
 *
 * The Blazor version injected ISnackbar through DI so any class could call
 * _snackbar.Add(displayMessage). React has no DI container, so components call
 * this hook instead:
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
 * Must be called inside a component that is a descendant of <ArcErrorDisplay>,
 * which is mounted at the app root in App.tsx.
 *
 * This lives apart from ArcErrorDisplay.tsx so that file only exports a
 * component — a module mixing components and plain functions breaks Fast Refresh.
 */

import { useCallback } from 'react'
import { useSnackbar } from 'notistack'

export const useArcError = () => {
    const { enqueueSnackbar } = useSnackbar()

    const addError = useCallback(
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
    const addSuccess = useCallback(
        (message: string) => {
            enqueueSnackbar(message, { variant: 'success' })
        },
        [enqueueSnackbar]
    )

    const addInfo = useCallback(
        (message: string) => {
            enqueueSnackbar(message, { variant: 'info' })
        },
        [enqueueSnackbar]
    )

    return { addError, addSuccess, addInfo }
}

export default useArcError

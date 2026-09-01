/**
 * useBoardActions
 *
 * One place where every board mutation gets its error handling and its refresh.
 *
 * The Blazor overlays each did two things after calling a repository: invoked the
 * page's Refresh callback, and let ArcErrorHandler surface anything that went
 * wrong (it was injected into ArcStridesService, so every HTTP call ran through
 * it). The React port had neither — mutations were bare `await` calls, so a failed
 * request became an unhandled promise rejection and the optimistically-updated UI
 * showed a change that never reached the server.
 *
 * `run` restores both behaviours:
 *
 *   const { run } = useBoardActions()
 *   const ok = await run('Add column', () => createColumn(boardId, { ... }))
 *   if (ok) onClose()
 *
 * On success it re-reads the board (see BoardStores.ts for why) and returns true.
 * On failure it shows the message in the snackbar and returns false, so the
 * overlay can stay open with the user's input intact instead of silently closing.
 */

import { useCallback } from 'react'
import { useArcError } from '../../Components/useArcError'
import { useBoardStore } from '../../Stores/BoardStores'

interface RunOptions {
    /**
     * Re-read the board after the action succeeds. Default true.
     * Pass false for mutations that have already updated local state correctly.
     */
    refresh?: boolean
}

export function useBoardActions() {
    const { addError } = useArcError()
    const refreshBoard = useBoardStore(state => state.refresh)

    const run = useCallback(
        async (label: string, action: () => Promise<unknown>, options: RunOptions = {}): Promise<boolean> => {
            const { refresh = true } = options

            try {
                await action()
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error)
                addError(`${label} failed: ${message}`)
                return false
            }

            if (refresh) await refreshBoard()

            return true
        },
        [addError, refreshBoard]
    )

    return { run }
}

export default useBoardActions

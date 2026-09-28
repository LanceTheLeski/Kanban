/**
 * useBoardTitles
 *
 * The names of the boards a month's cards come from, for the day views that
 * page by board (see Calendar.Views).
 *
 * A card on the calendar carries its board's ID and not its name, and the API
 * has no endpoint that names boards without reading all of one (docs/api-gaps.md,
 * #4). So a board is read in full, once per session, and only when a month has
 * cards from more than one board — with one, there are no board views to name.
 * Until a name arrives, the view is labelled by its position instead.
 */

import { useCallback, useEffect, useState } from 'react'
import { fetchBoard } from '../Board/Board.APIs'

export function useBoardTitles(boardIds: string[]): (boardId: string) => string | null {
    const distinct = [...new Set(boardIds.filter(Boolean))].sort()
    const key = distinct.length > 1 ? distinct.join(',') : ''

    // Bumped when a name arrives, so the lookup below changes identity and the
    // days that use it recompute their views.
    const [version, setVersion] = useState(0)

    useEffect(() => {
        if (!key) return
        let current = true
        const missing = key.split(',').filter(id => !TITLES.has(id) && !REQUESTED.has(id))
        for (const id of missing) {
            REQUESTED.add(id)
            fetchBoard(id)
                .then(board => {
                    TITLES.set(id, board.title || null)
                    if (current) setVersion(value => value + 1)
                })
                .catch(() => REQUESTED.delete(id))
        }
        return () => { current = false }
    }, [key])

    // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` is the signal that TITLES changed
    return useCallback((boardId: string) => TITLES.get(boardId) ?? null, [version])
}

export default useBoardTitles

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** Names read so far this session. A null is a board that has no name. */
const TITLES = new Map<string, string | null>()
const REQUESTED = new Set<string>()

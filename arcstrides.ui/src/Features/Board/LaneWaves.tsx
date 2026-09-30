/**
 * LaneWaves
 *
 * The foot of every swimlane, in cut paper — a swim lane, as water: two layers
 * of wave between two lines of foam, running the lane's length and frosted
 * wherever a column's glass crosses it. The style of the calendar's day types
 * (see DayArt), from the same papers (see Styles/Scenery).
 *
 * Decoration, hidden from screen readers; the lanes' names are text beside it.
 *
 * This file was BoardArt.tsx, and held a honu too, for the board's corner and a
 * timeless card's timeline panel; both were taken out to leave those places
 * plain for now. It is in the history, in commit 8557165.
 */

import React, { useId } from 'react'
import { SCENERY as C } from '../../Styles/Scenery'

/** Water along the foot of a swimlane, as long as the lane is. */
export const LaneWaves: React.FC = () => {
    const id = useId().replace(/[^\w-]/g, '')
    const cut = `url(#${id}-cut)`

    return (
        // Drawn far wider than any board, one unit to a pixel at this height,
        // and cropped to the lane from the left — so a wave is the same size on
        // every lane however wide the board is, rather than stretched to fit.
        <svg viewBox={`0 0 ${LANE_W} ${LANE_H}`}
             preserveAspectRatio="xMinYMax slice"
             aria-hidden
             style={{ display: 'block', width: '100%', height: '100%' }}>
            <defs>
                <filter id={`${id}-cut`} x="0" y="-20%" width="100%" height="140%">
                    <feDropShadow dx="0" dy="0.7" stdDeviation="0.6" floodColor={C.cutShadow} floodOpacity="0.32" />
                </filter>
            </defs>
            <path d={wave(8, 3, 64, 17)} fill={C.foam} filter={cut} />
            <path d={wave(10, 3, 64, 0)} fill={C.seaFar} filter={cut} />
            <path d={wave(14.5, 2.4, 44, 9)} fill={C.seaNear} filter={cut} />
            <path d={wave(19, 1.6, 30, 4)} fill={C.foam} filter={cut} />
        </svg>
    )
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** The waves' drawing: far wider than a board, and one unit to a pixel. */
const LANE_W = 2400
const LANE_H = 24

/**
 * A band of water from `baseline` down to the foot: a crest and a trough per
 * `period`, `amplitude` either side of the baseline, started `phase` early so
 * the layers' crests do not line up.
 */
function wave(baseline: number, amplitude: number, period: number, phase: number): string {
    let d = `M ${-phase} ${LANE_H} V ${baseline}`
    for (let x = -phase; x < LANE_W; x += period)
        d += ` q ${period / 4} ${-amplitude} ${period / 2} 0 t ${period / 2} 0`
    return `${d} V ${LANE_H} Z`
}

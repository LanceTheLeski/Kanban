/**
 * BoardArt
 *
 * The board's cut-paper pictures, in the style of the calendar's day types
 * (see DayArt) and from the same papers (see Styles/Scenery):
 *
 *   HonuArt     the board's corner, where "Honu Boards" is written — a honu, a
 *               green sea turtle, swimming over a sandy bottom, which is what
 *               the app's name and its Honu button are
 *   LaneWaves   the foot of every swimlane — a swim lane, as water: two layers
 *               of wave between two lines of foam, running the lane's
 *               length and frosted wherever a column's glass crosses it
 *
 * Both are decoration and hidden from screen readers; the title and the
 * lanes' names are text beside them.
 */

import React, { useId } from 'react'
import { PaperScene } from '../../Components/PaperScene'
import { SCENERY as C } from '../../Styles/Scenery'

/** A honu over the sea floor. Fills its box; the turtle stays in the middle. */
export const HonuArt: React.FC = () => (
    <PaperScene width={HONU_W} height={HONU_H} sky={[C.seaDeep, C.seaNear]}>
        {cut => (
            <>
                <path d="M0 52 C25 48 50 54 80 50 C100 48 112 51 120 49 V64 H0 Z" fill={C.sandShade} filter={cut} />

                {/* Sea grass, either side. */}
                <g filter={cut}>
                    <path d="M12 58 C10 50 14 44 12 36 C16 44 15 51 15 58 Z" fill={C.frond} />
                    <path d="M16 58 C17 51 21 47 22 41 C22 48 20 53 19 58 Z" fill={C.frondDark} />
                    <path d="M104 58 C103 51 106 46 105 40 C109 47 108 52 107 58 Z" fill={C.frondDark} />
                    <path d="M108 58 C110 52 113 49 116 45 C114 51 112 55 111 58 Z" fill={C.frond} />
                </g>

                <path d="M0 57 C30 54 70 60 120 55 V64 H0 Z" fill={C.sand} filter={cut} />

                {/* Two bubbles off the turtle's nose. */}
                <circle cx={84} cy={20} r={1} fill={C.foam} />
                <circle cx={87} cy={15.5} r={0.7} fill={C.foam} />

                <Honu x={58} y={31} heading={-12} size={1.35} cut={cut} />
            </>
        )}
    </PaperScene>
)

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

const HONU_W = 120
const HONU_H = 64

/**
 * A green sea turtle from above, nose toward `heading` degrees (0 is right):
 * four flippers, the front pair long and swept back as it strokes, a head,
 * and a shell with its plates cut from a paler sheet laid on top.
 */
function Honu({ x, y, heading, size, cut }: { x: number; y: number; heading: number; size: number; cut: string }) {
    return (
        <g transform={`translate(${x} ${y}) rotate(${heading}) scale(${size})`}>
            <g filter={cut}>
                {/* Flippers: front pair long and swept, back pair small. */}
                <path d="M3 -5 C1 -13 -5 -16 -10 -15 C-6 -12 -2 -8 0 -3 Z" fill={C.skin} />
                <path d="M3 5 C1 13 -5 16 -10 15 C-6 12 -2 8 0 3 Z" fill={C.skin} />
                <ellipse cx={-8.5} cy={-5} rx={3.4} ry={1.7} transform="rotate(-35 -8.5 -5)" fill={C.skin} />
                <ellipse cx={-8.5} cy={5} rx={3.4} ry={1.7} transform="rotate(35 -8.5 5)" fill={C.skin} />
                <ellipse cx={11} cy={0} rx={3.4} ry={2.7} fill={C.skin} />
            </g>

            <g filter={cut}>
                <ellipse cx={0} cy={0} rx={10} ry={7.8} fill={C.shell} />
            </g>

            {/* The plates: one down the middle, a row either side. */}
            <g fill={C.shellPlate}>
                <ellipse cx={0.5} cy={0} rx={3.1} ry={2.3} />
                <ellipse cx={-4.6} cy={-3.4} rx={2.3} ry={1.8} />
                <ellipse cx={-4.6} cy={3.4} rx={2.3} ry={1.8} />
                <ellipse cx={4.6} cy={-3.2} rx={2.1} ry={1.7} />
                <ellipse cx={4.6} cy={3.2} rx={2.1} ry={1.7} />
                <ellipse cx={-7.4} cy={0} rx={1.5} ry={1.4} />
            </g>

            <circle cx={12.4} cy={-1.3} r={0.55} fill={C.towerNear} />
            <circle cx={12.4} cy={1.3} r={0.55} fill={C.towerNear} />
        </g>
    )
}

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

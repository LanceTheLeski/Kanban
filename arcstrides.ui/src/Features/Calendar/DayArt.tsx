/**
 * DayArt
 *
 * A day type's picture: a small scene in cut paper, layer on layer, each
 * casting a hairline shadow on the one behind it.
 *
 *   Work       a city — three rows of towers, lit windows in the front one
 *   Leisure    a park — hills, a tree, a kite
 *   Vacation   a beach — sea, sand, a palm and a parasol
 *
 * Replaces: the gradient swatch in UpdateDateOverlay.razor's header, which was
 * to open a palette picker. A day's look was always going to be its type's; a
 * picture says which type at a glance, where a colour needed a legend.
 *
 * ── Drawn to be cropped ──────────────────────────────────────────────────────
 * The same scene fills a tile a day wide and a line tall on the grid, and a
 * near-square panel in the day overlay, so it is drawn 2:1 and cropped to fit
 * (see PaperScene). What makes each scene recognisable is kept in the middle
 * and the lower half.
 *
 * The frame — the sky, the shadow each layer casts — is PaperScene's, and every
 * colour is a named piece of Styles/Scenery: a step of one of the paper
 * ladders, or a tint between two steps of the same one. So the scenes are cut
 * from the same papers as the panels around them, not painted beside them.
 */

import React from 'react'
import { PaperScene, Sun } from '../../Components/PaperScene'
import { SCENERY as C } from '../../Styles/Scenery'
import type { Scene } from './Calendar.DayTypes'

interface DayArtProps {
    scene: Scene
    /**
     * Said to a screen reader. Left out where the picture is inside a control
     * whose own name already says which type it is.
     */
    label?: string
}

export const DayArt: React.FC<DayArtProps> = ({ scene, label }) => (
    <PaperScene width={W} height={H} sky={SKIES[scene]} label={label}>
        {cut => (
            <>
                {scene === 'city' && <City cut={cut} />}
                {scene === 'park' && <Park cut={cut} />}
                {scene === 'beach' && <Beach cut={cut} />}
            </>
        )}
    </PaperScene>
)

export default DayArt

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** The drawing's own units. 2:1, and cropped to fit — see the header. */
const W = 160
const H = 80

/** Top and bottom of each scene's sky: a cool blue, warming to the horizon. */
const SKIES: Record<Scene, [string, string]> = {
    city: [C.skyHigh, C.skyHaze],
    park: [C.skyHigh, C.skyWarm],
    beach: [C.skyHigh, C.skyGlow],
}

/** [left, width, top] of each tower in a row; every tower stands on the bottom edge. */
type Row = [number, number, number][]

function towers(row: Row): string {
    return row.map(([x, w, top]) => `M${x} ${H} V${top} H${x + w} V${H} Z`).join(' ')
}

const BACK: Row = [[0, 14, 50], [14, 10, 44], [24, 16, 52], [40, 12, 40], [52, 18, 48], [70, 10, 34], [80, 14, 46],
                   [94, 12, 42], [106, 16, 50], [122, 10, 38], [132, 14, 47], [146, 14, 52]]
const MIDDLE: Row = [[4, 12, 58], [16, 9, 52], [25, 14, 60], [39, 10, 49], [49, 16, 56], [65, 8, 45], [73, 14, 54],
                     [87, 10, 50], [97, 18, 58], [115, 9, 47], [124, 14, 55], [138, 10, 51], [148, 12, 57]]
const FRONT: Row = [[0, 16, 64], [16, 12, 60], [28, 18, 66], [46, 11, 58], [57, 20, 63], [77, 13, 56], [90, 16, 65],
                    [106, 12, 59], [118, 20, 64], [138, 11, 61], [149, 11, 66]]

/**
 * The front row's windows, some lit. Which ones is fixed by position rather
 * than random, so the city does not flicker every time a day is drawn.
 */
function windows(row: Row): { x: number; y: number; lit: boolean }[] {
    return row.flatMap(([x, w, top], tower) => {
        const across = Math.floor((w - 3) / 3.4)
        const down = Math.floor((H - top - 5) / 3.8)
        return Array.from({ length: across * down }, (_, index) => {
            const column = index % across
            const floor = Math.floor(index / across)
            return {
                x: x + 2.2 + column * 3.4,
                y: top + 3 + floor * 3.8,
                lit: (tower * 5 + column * 7 + floor * 13) % 5 < 2,
            }
        })
    })
}

function City({ cut }: { cut: string }) {
    return (
        <>
            <Sun x={46} y={46} cut={cut} />
            <path d={towers(BACK)} fill={C.towerFar} filter={cut} />
            <g filter={cut}>
                <path d={towers(MIDDLE)} fill={C.towerMid} />
                {/* A spire on the tallest of the middle row. */}
                <rect x={68.6} y={37} width={0.8} height={8} fill={C.towerMid} />
            </g>
            <g filter={cut}>
                <path d={towers(FRONT)} fill={C.towerNear} />
                {windows(FRONT).map(({ x, y, lit }) => (
                    <rect key={`${x}:${y}`} x={x} y={y} width={1.6} height={1.9} fill={lit ? C.windowLit : C.windowDark} />
                ))}
            </g>
        </>
    )
}

function Park({ cut }: { cut: string }) {
    return (
        <>
            <Sun x={122} y={44} cut={cut} />

            {/* The kite, and its tail of bows, on a string down to the grass. */}
            <path d="M58 47 C66 57 76 62 88 72" fill="none" stroke={C.seed} strokeWidth={0.35} opacity={0.7} />
            <g filter={cut}>
                <path d="M58 35 L63.5 42 L58 50 L52.5 42 Z" fill={C.canvas} />
                <path d="M58 35 V50 M52.5 42 H63.5" stroke={C.cord} strokeWidth={0.5} />
                <path d="M58 50 C55.5 53.5 60 55.5 57 59.5" fill="none" stroke={C.cord} strokeWidth={0.5} />
                <path d="M55.6 53.2 L58.4 52.2 L58 54.6 Z" fill={C.canvasStripe} />
                <path d="M56.4 56.8 L59.2 55.8 L58.8 58.2 Z" fill={C.bow} />
            </g>

            <path d="M0 58 C30 50 60 54 90 57 C115 59 140 52 160 54 V80 H0 Z" fill={C.hillFar} filter={cut} />

            <g filter={cut}>
                <rect x={106.8} y={55} width={2.4} height={13} fill={C.barkDark} />
                <circle cx={102.5} cy={56} r={6} fill={C.leaf} />
                <circle cx={114} cy={56.5} r={6.5} fill={C.leafDark} />
                <circle cx={108} cy={51} r={8} fill={C.leafDark} />
            </g>

            <g filter={cut}>
                <path d="M0 68 C35 60 75 66 105 67 C130 68 148 62 160 63 V80 H0 Z" fill={C.hill} />
                {[[22, 71, C.canvasStripe], [30, 74, C.bow], [44, 70, C.canvasStripe], [128, 72, C.bow], [140, 69, C.canvasStripe]]
                    .map(([x, y, fill]) => <circle key={`${x}`} cx={x} cy={y} r={0.9} fill={fill as string} />)}
            </g>

            <path d="M0 76 C50 72 100 78 160 74 V80 H0 Z" fill={C.grass} filter={cut} />
        </>
    )
}

function Beach({ cut }: { cut: string }) {
    return (
        <>
            <Sun x={118} y={46} cut={cut} />

            <path d="M0 56 Q20 54 40 56 T80 56 T120 56 T160 56 V80 H0 Z" fill={C.seaFar} filter={cut} />
            <path d="M0 62 Q20 59 40 62 T80 62 T120 62 T160 62 V80 H0 Z" fill={C.seaNear} filter={cut} />
            <path d="M0 70 C30 64 70 66 100 68 C125 70 145 66 160 65 V80 H0 Z" fill={C.sand} filter={cut} />

            {/* The palm: a leaning trunk, a crown of fronds, two coconuts. */}
            <g filter={cut}>
                <path d="M50 73 C49 65 51 56 56 47" fill="none" stroke={C.bark} strokeWidth={3} strokeLinecap="round" />
                <path d="M56 47 C48 41 40 43 36 49 C43 45 50 46 56 47 Z" fill={C.frond} />
                <path d="M56 47 C64 40 73 42 77 48 C70 44 63 45 56 47 Z" fill={C.frond} />
                <path d="M56 47 C52 39 54 34 58 32 C57 37 57 42 56 47 Z" fill={C.frondDark} />
                <path d="M56 47 C61 41 67 38 71 39 C66 41 61 44 56 47 Z" fill={C.frondDark} />
                <path d="M56 47 C50 45 44 50 43 56 C47 51 51 49 56 47 Z" fill={C.leafDark} />
                <circle cx={55} cy={49} r={1.4} fill={C.seed} />
                <circle cx={57.6} cy={49.4} r={1.4} fill={C.seed} />
            </g>

            {/* The parasol, striped, planted in the sand. */}
            <g filter={cut}>
                <path d="M100 56 L101 72" stroke={C.cord} strokeWidth={1.1} />
                <path d="M88 62 Q100 50 112 62 Z" fill={C.canvas} />
                <path d="M100 51 L93 62 H97 Z M100 51 L103 62 H107 Z" fill={C.canvasStripe} />
            </g>

            <path d="M0 76 C40 72 90 78 160 74 V80 H0 Z" fill={C.sandShade} filter={cut} />
        </>
    )
}

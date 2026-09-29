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
 * near-square panel in the day overlay. So it is drawn 2:1 and fills whatever
 * box it is given, anchored to the bottom and the middle: a wide tile keeps the
 * ground and loses sky, a square one keeps the sky and loses the ends. What
 * makes each scene recognisable is kept in the middle and the lower half.
 *
 * Colours come from the tonal ladders in docs/ui-conventions.md — each hue's
 * ground, mid and deep — so the scenes sit in the same family as the paper
 * stocks rather than beside them.
 */

import React, { useId } from 'react'
import { Box } from '@mui/material'
import type { Scene } from './Calendar.DayTypes'

interface DayArtProps {
    scene: Scene
    /**
     * Said to a screen reader. Left out where the picture is inside a control
     * whose own name already says which type it is.
     */
    label?: string
}

export const DayArt: React.FC<DayArtProps> = ({ scene, label }) => {
    // An ID for this copy's filter and gradient, so the several scenes on a
    // page never pick up one another's. useId's own characters are not all
    // welcome inside url(#…).
    const id = useId().replace(/[^\w-]/g, '')
    const cut = `url(#${id}-cut)`
    const [top, bottom] = SKIES[scene]

    return (
        <Box component="svg"
             viewBox={`0 0 ${W} ${H}`}
             preserveAspectRatio="xMidYMax slice"
             role={label ? 'img' : undefined}
             aria-label={label}
             aria-hidden={label ? undefined : true}
             sx={{ display: 'block', width: '100%', height: '100%' }}>
            <defs>
                <filter id={`${id}-cut`} x="-5%" y="-10%" width="110%" height="130%">
                    <feDropShadow dx="0" dy="0.7" stdDeviation="0.6" floodColor="#2b1f10" floodOpacity="0.32" />
                </filter>
                <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={top} />
                    <stop offset="1" stopColor={bottom} />
                </linearGradient>
            </defs>

            <rect width={W} height={H} fill={`url(#${id}-sky)`} />

            {scene === 'city' && <City cut={cut} />}
            {scene === 'park' && <Park cut={cut} />}
            {scene === 'beach' && <Beach cut={cut} />}
        </Box>
    )
}

export default DayArt

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** The drawing's own units. 2:1, and cropped to fit — see the header. */
const W = 160
const H = 80

/** Top and bottom of each scene's sky: a cool blue, warming to the horizon. */
const SKIES: Record<Scene, [string, string]> = {
    city: ['#cbdff2', '#eef0ea'],
    park: ['#d3e8f1', '#f3eed9'],
    beach: ['#cfe3f4', '#f5ead3'],
}

/** The low sun every scene has, behind its first layer. */
function Sun({ x, y, cut }: { x: number; y: number; cut: string }) {
    return (
        <g filter={cut}>
            <circle cx={x} cy={y} r={11} fill="#f6e5b0" />
            <circle cx={x} cy={y} r={7.5} fill="#efc964" />
        </g>
    )
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
            <path d={towers(BACK)} fill="#b3cde6" filter={cut} />
            <g filter={cut}>
                <path d={towers(MIDDLE)} fill="#79aad8" />
                {/* A spire on the tallest of the middle row. */}
                <rect x={68.6} y={37} width={0.8} height={8} fill="#79aad8" />
            </g>
            <g filter={cut}>
                <path d={towers(FRONT)} fill="#295074" />
                {windows(FRONT).map(({ x, y, lit }) => (
                    <rect key={`${x}:${y}`} x={x} y={y} width={1.6} height={1.9} fill={lit ? '#ecdeb1' : '#3d6a93'} />
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
            <path d="M58 47 C66 57 76 62 88 72" fill="none" stroke="#5c4b14" strokeWidth={0.35} opacity={0.7} />
            <g filter={cut}>
                <path d="M58 35 L63.5 42 L58 50 L52.5 42 Z" fill="#d59185" />
                <path d="M58 35 V50 M52.5 42 H63.5" stroke="#703c34" strokeWidth={0.5} />
                <path d="M58 50 C55.5 53.5 60 55.5 57 59.5" fill="none" stroke="#703c34" strokeWidth={0.5} />
                <path d="M55.6 53.2 L58.4 52.2 L58 54.6 Z" fill="#f5d6d0" />
                <path d="M56.4 56.8 L59.2 55.8 L58.8 58.2 Z" fill="#ecdeb1" />
            </g>

            <path d="M0 58 C30 50 60 54 90 57 C115 59 140 52 160 54 V80 H0 Z" fill="#a9d3c0" filter={cut} />

            <g filter={cut}>
                <rect x={106.8} y={55} width={2.4} height={13} fill="#6e4f2c" />
                <circle cx={102.5} cy={56} r={6} fill="#3d8b6c" />
                <circle cx={114} cy={56.5} r={6.5} fill="#2f7a5d" />
                <circle cx={108} cy={51} r={8} fill="#2f7a5d" />
            </g>

            <g filter={cut}>
                <path d="M0 68 C35 60 75 66 105 67 C130 68 148 62 160 63 V80 H0 Z" fill="#6cb69a" />
                {[[22, 71, '#f5d6d0'], [30, 74, '#ecdeb1'], [44, 70, '#f5d6d0'], [128, 72, '#ecdeb1'], [140, 69, '#f5d6d0']]
                    .map(([x, y, fill]) => <circle key={`${x}`} cx={x} cy={y} r={0.9} fill={fill as string} />)}
            </g>

            <path d="M0 76 C50 72 100 78 160 74 V80 H0 Z" fill="#4f9f80" filter={cut} />
        </>
    )
}

function Beach({ cut }: { cut: string }) {
    return (
        <>
            <Sun x={118} y={46} cut={cut} />

            <path d="M0 56 Q20 54 40 56 T80 56 T120 56 T160 56 V80 H0 Z" fill="#79aad8" filter={cut} />
            <path d="M0 62 Q20 59 40 62 T80 62 T120 62 T160 62 V80 H0 Z" fill="#a7c8e6" filter={cut} />
            <path d="M0 70 C30 64 70 66 100 68 C125 70 145 66 160 65 V80 H0 Z" fill="#ecdeb1" filter={cut} />

            {/* The palm: a leaning trunk, a crown of fronds, two coconuts. */}
            <g filter={cut}>
                <path d="M50 73 C49 65 51 56 56 47" fill="none" stroke="#8b6b3b" strokeWidth={3} strokeLinecap="round" />
                <path d="M56 47 C48 41 40 43 36 49 C43 45 50 46 56 47 Z" fill="#3f8f70" />
                <path d="M56 47 C64 40 73 42 77 48 C70 44 63 45 56 47 Z" fill="#3f8f70" />
                <path d="M56 47 C52 39 54 34 58 32 C57 37 57 42 56 47 Z" fill="#175a45" />
                <path d="M56 47 C61 41 67 38 71 39 C66 41 61 44 56 47 Z" fill="#175a45" />
                <path d="M56 47 C50 45 44 50 43 56 C47 51 51 49 56 47 Z" fill="#2f7a5d" />
                <circle cx={55} cy={49} r={1.4} fill="#5c4b14" />
                <circle cx={57.6} cy={49.4} r={1.4} fill="#5c4b14" />
            </g>

            {/* The parasol, striped, planted in the sand. */}
            <g filter={cut}>
                <path d="M100 56 L101 72" stroke="#703c34" strokeWidth={1.1} />
                <path d="M88 62 Q100 50 112 62 Z" fill="#d59185" />
                <path d="M100 51 L93 62 H97 Z M100 51 L103 62 H107 Z" fill="#f5d6d0" />
            </g>

            <path d="M0 76 C40 72 90 78 160 74 V80 H0 Z" fill="#dcc98f" filter={cut} />
        </>
    )
}

/**
 * Scenery.ts
 *
 * The colours the cut-paper pictures are cut from — the day types' scenes and
 * the board's — named for what they are in a picture rather than for where
 * they sit on a ladder.
 *
 * Every one is a step of a ladder in Palette.ts, or a tint between two steps of
 * the same ladder. That is the whole rule, and it is what makes a picture look
 * cut from the same papers as the panels around it: nothing in a scene is a
 * hue the rest of the app does not have.
 */

import { LADDERS, NEUTRALS } from './Palette'

const { blue, green, red, yellow } = LADDERS

export const SCENERY = {
    // The sky, cool at the top and warming to the horizon.
    skyHigh: blue.ground,
    skyHaze: mix(NEUTRALS.cream, blue.ground, 0.3),
    skyWarm: mix(NEUTRALS.cream, yellow.ground, 0.2),
    skyGlow: mix(NEUTRALS.cream, yellow.ground, 0.4),

    sun: mix(yellow.mid, yellow.ground, 0.3),
    sunHalo: mix(yellow.ground, NEUTRALS.cream, 0.4),

    // Water, far to near.
    seaFar: blue.mid,
    seaNear: mix(blue.ground, blue.mid, 0.5),
    foam: mix(blue.ground, NEUTRALS.cream, 0.5),
    seaDeep: mix(blue.mid, blue.deep, 0.45),

    sand: yellow.ground,
    sandShade: mix(yellow.ground, yellow.mid, 0.4),

    // A city, back row to front.
    towerFar: mix(blue.ground, blue.mid, 0.3),
    towerMid: blue.mid,
    towerNear: blue.deep,
    windowLit: yellow.ground,
    windowDark: mix(blue.mid, blue.deep, 0.6),

    // Grass and leaves, pale to dark.
    hillFar: mix(green.ground, green.mid, 0.5),
    hill: green.mid,
    grass: mix(green.mid, green.deep, 0.25),
    leaf: mix(green.mid, green.deep, 0.45),
    leafDark: mix(green.mid, green.deep, 0.6),
    frond: mix(green.mid, green.deep, 0.35),
    frondDark: green.deep,

    // Wood, from the yellow ladder's deep end.
    bark: mix(yellow.deep, yellow.mid, 0.35),
    barkDark: mix(yellow.deep, red.deep, 0.35),
    seed: yellow.deep,

    // Cloth and paper toys.
    canvas: red.mid,
    canvasStripe: red.ground,
    cord: red.deep,
    bow: yellow.ground,

    // A turtle's shell and skin.
    shell: mix(green.mid, green.deep, 0.5),
    shellPlate: mix(green.ground, green.mid, 0.55),
    skin: mix(green.ground, green.mid, 0.25),

    // Under every layer, the hairline shadow a sheet casts on the one behind it.
    cutShadow: mix(yellow.deep, '#000000', 0.55),
} as const

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** A tint `t` of the way from one `#rrggbb` to another. */
function mix(from: string, to: string, t: number): string {
    const channels = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
    const a = channels(from)
    const b = channels(to)
    return '#' + a.map((value, i) => Math.round(value + (b[i] - value) * t).toString(16).padStart(2, '0')).join('')
}

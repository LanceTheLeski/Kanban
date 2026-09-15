/**
 * cardSensors
 *
 * What counts as picking a card up.
 *
 * ── Why the whole card, and what that costs ──────────────────────────────────
 * A card used to be dragged by a 16px strip at its top with a grip icon in it.
 * That is a small target for the primary gesture on a Kanban board, and the icon
 * spent a row of every card explaining where to aim.
 *
 * The listeners now go on the whole tile, which means the tile has to tell three
 * gestures apart that all begin with a press on the same pixels:
 *
 *   press and move          drag the card
 *   press and release       open the card
 *   press on a button       run that button
 *
 * The first two are separated by the 8px activation distance: under 8px dnd-kit
 * never starts a drag and the click lands normally. The third is separated here,
 * by refusing to activate at all when the press began inside something
 * interactive.
 *
 * ── Why not PointerSensor ────────────────────────────────────────────────────
 * PointerSensor handles mouse and touch through one code path, which is why it
 * was the obvious choice — but it requires `touch-action: none` on the draggable
 * so the browser does not claim the gesture for scrolling. On a strip at the top
 * of a card that was free. On the whole card it is not: cells scroll vertically
 * once they hold more than they can show, and a card covering the cell with
 * `touch-action: none` would make that cell impossible to scroll with a finger.
 *
 * Splitting the two sensors is dnd-kit's documented answer for draggables inside
 * a scroll container, and it lets each input use the gesture that suits it:
 *
 *   mouse   drag begins after 8px of movement
 *   touch   drag begins after a 250ms hold, so a swipe scrolls the cell instead
 *
 * The hold also gives touch users an undo: move more than 8px before the delay
 * elapses and it is a scroll, not a drag.
 */

import { MouseSensor, TouchSensor } from '@dnd-kit/core'

/**
 * Anything that handles its own press.
 *
 * `[data-no-drag]` is the escape hatch for a control this list does not name —
 * put it on the element and presses inside it stop starting drags.
 */
const INTERACTIVE_SELECTOR = [
    'button',
    'a',
    'input',
    'textarea',
    'select',
    'label',
    '[role="button"]',
    '[role="checkbox"]',
    '[data-no-drag]',
].join(', ')

/**
 * Whether a press landed on something interactive *inside* the card.
 *
 * `closest` rather than a check on the target itself, because a press on a
 * Button lands on whatever span MUI renders inside it, not on the button.
 *
 * ── Why the search is bounded by the draggable root ──────────────────────────
 * The first version of this asked only `target.closest(INTERACTIVE_SELECTOR)`,
 * and no card could be dragged at all. dnd-kit's `attributes` put
 * `role="button"` and `tabIndex=0` on the draggable so it can be picked up from
 * the keyboard — and `closest` starts at the element itself, so the card matched
 * its own selector. Every press looked like a press on a button, and the sensor
 * declined every one of them.
 *
 * So the question is not "is there an interactive ancestor" but "is there one
 * between the target and the card". A match that *is* the card, or is outside
 * it, is not a reason to refuse.
 */
function beganOnInteractiveElement(target: EventTarget | null, root: EventTarget | null): boolean {
    if (!(target instanceof Element) || !(root instanceof Element)) return false

    const match = target.closest(INTERACTIVE_SELECTOR)
    return match !== null && match !== root && root.contains(match)
}

/**
 * dnd-kit decides whether to begin tracking a gesture by calling the handler on
 * a sensor's `activators`. Returning false there means the sensor never engages,
 * so the press stays an ordinary press and the button underneath behaves
 * normally — which is different from starting a drag and cancelling it.
 */
export class CardMouseSensor extends MouseSensor {
    static activators = [
        {
            eventName: 'onMouseDown' as const,
            handler: ({ nativeEvent, currentTarget }: React.MouseEvent) =>
                !beganOnInteractiveElement(nativeEvent.target, currentTarget),
        },
    ]
}

export class CardTouchSensor extends TouchSensor {
    static activators = [
        {
            eventName: 'onTouchStart' as const,
            handler: ({ nativeEvent, currentTarget }: React.TouchEvent) =>
                !beganOnInteractiveElement(nativeEvent.target, currentTarget),
        },
    ]
}

/** Mouse: 8px of travel. Touch: a 250ms hold, with 8px of slop while waiting. */
export const CARD_MOUSE_ACTIVATION = { distance: 8 }
export const CARD_TOUCH_ACTIVATION = { delay: 250, tolerance: 8 }

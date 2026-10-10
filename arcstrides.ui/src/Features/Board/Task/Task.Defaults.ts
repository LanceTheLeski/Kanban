/**
 * Task.Defaults
 *
 * What a new task starts as, where the place it is made from knows better than
 * nothing.
 *
 * A card opened from a calendar day is opened over that day, and a day has a
 * kind — Work, Leisure — whose options can name the task type its new tasks
 * start as (Calendar → Options). The card editor is the board's and knows
 * nothing of days, so the calendar says it through this, around the card, and
 * CreateTaskOverlay reads it. Anywhere else there is no provider, and a new task
 * starts with no type chosen, as it always has.
 */

import { createContext } from 'react'

/** The task type a new task starts as here; null for none. */
export const DefaultTaskTypeContext = createContext<number | null>(null)

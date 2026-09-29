/**
 * useGridDaySize
 *
 * How big a day is drawn on the month grid, kept up to date as the window, the
 * week's other days or the day itself change size.
 *
 * The day overlay draws its live copy of the day at exactly this size, so the
 * copy is the calendar's day and not a version of it laid out for a narrower
 * or wider column. A grid day is as wide as its column and as tall as its week,
 * which is the tallest day in the week — neither of which the copy could work
 * out from its own contents.
 *
 * Found through the DOM, by the data-day attribute DayCell puts on the grid's
 * copy: the grid is still there, under the overlay, and asking it is simpler
 * than threading every day's measurements up through the store.
 */

import { useEffect, useState } from 'react'

export interface DaySize {
    width: number
    height: number
}

/** The grid day's size, or null until it has been measured. */
export function useGridDaySize(dayKey: string): DaySize | null {
    const [size, setSize] = useState<DaySize | null>(null)

    useEffect(() => {
        const day = document.querySelector<HTMLElement>(`[data-day="${dayKey}"]`)
        if (!day) return

        // A ResizeObserver reports once as soon as it starts watching, so the
        // first measurement needs no call of its own.
        const observer = new ResizeObserver(() => {
            const box = day.getBoundingClientRect()
            setSize(previous => previous && previous.width === box.width && previous.height === box.height
                ? previous
                : { width: box.width, height: box.height })
        })
        observer.observe(day)
        return () => observer.disconnect()
    }, [dayKey])

    return size
}

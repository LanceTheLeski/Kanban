/**
 * useDayTypes
 *
 * What kind of day a date is, by the calendar's options — and the choices a
 * day's type picker offers. Every component that draws a day asks this rather
 * than reading `typeId` off the stored row, which only says what was chosen for
 * the day itself (0 for nothing; see Calendar.DayTypes).
 */

import { useEffect, useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import {
    configuredDayType,
    DAY_TYPES,
    defaultDayTypeId,
    isWeekend,
    PLAIN_DAY_TYPE,
    resolveDayType,
    type DayType,
    type DayTypeOptions,
} from '../Calendar.DayTypes'
import { useCalendarOptions } from '../Calendar.Options'

/** One entry in a day's type picker. */
export interface DayTypeChoice
{
    /** What choosing it stores: a type's number, or 0 for the week's default. */
    id: number

    /** How a day of it is drawn — the default's is the type it stands for. */
    type: DayType

    name: string

    note: string
}

export interface DayTypes
{
    options: DayTypeOptions

    /** What kind of day a date is, given what was chosen for it (0 or nothing for nothing). */
    typeOf: (date: Dayjs, storedId: number | null | undefined) => DayType

    /** The picker's entries for a date: its default first, then every type. */
    choicesFor: (date: Dayjs) => DayTypeChoice[]
}

export function useDayTypes(): DayTypes
{
    const options = useCalendarOptions(state => state.options)
    const load = useCalendarOptions(state => state.load)

    useEffect(() =>
    {
        load()
    }, [load])

    return useMemo<DayTypes>(() =>
    ({
        options,
        typeOf: (date, storedId) => resolveDayType(date, storedId, options),
        choicesFor: date =>
        {
            const fallback = configuredDayType(defaultDayTypeId(date, options), options)
            const half = isWeekend(date, options)
                ? 'weekend'
                : 'weekday'

            return [
                {
                    id: 0,
                    type: fallback,
                    name: 'As the week says',
                    note: `${fallback.name}, a ${half}'s default — see Calendar → Options`,
                },
                ...[...DAY_TYPES, PLAIN_DAY_TYPE].map(type =>
                {
                    const configured = configuredDayType(type.id, options)
                    return { id: type.id, type: configured, name: configured.name, note: configured.blurb }
                }),
            ]
        },
    }), [options])
}

export default useDayTypes

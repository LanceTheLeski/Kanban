/**
 * Setup.test.ts
 *
 * What every other test here takes for granted (vitest.config.ts).
 */

import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { isTimed } from '@ui/Features/Board/Timeline/Timeline.Nodes'

describe('the tests', () =>
{
    it("run in Chicago's time, whatever the machine's zone", () =>
    {
        expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/Chicago')
        expect(dayjs('2026-10-28T05:00:00Z').hour()).toBe(0)
    })

    it('share dayjs with the UI, so a date made here is one the UI reads', () =>
    {
        expect(isTimed(dayjs('2026-10-28T00:00'))).toBe(false)
        expect(isTimed(dayjs('2026-10-28T09:30'))).toBe(true)
    })
})

/**
 * ProgressMeter
 *
 * How many of a day's tasks are done: a meter, and the count beside it.
 *
 * Mirrors: the MudChart line chart on each Blazor date, which was fed a flat
 * series — the same completion ratio four times over — and so drew a level
 * line whose height was the one number it had. A single ratio against a limit
 * is what a meter is for, and it can be read at a glance where the line had to
 * be measured against an axis it did not have.
 *
 * One hue: the done part in the palette's blue, the rest a lighter step of the
 * same blue, so the whole bar reads as one measure. The count is ink, never
 * the bar's colour, and it is what makes the meter readable without the bar.
 */

import React from 'react'
import { Box } from '@mui/material'
import { MONO } from '../../Styles/Fonts'
import { METER_FILL, METER_TRACK } from './Calendar.Stats'

interface ProgressMeterProps {
    done: number
    total: number
    /** Bar thickness in px. */
    thickness?: number
    fontSize?: string
}

export const ProgressMeter: React.FC<ProgressMeterProps> = ({ done, total, thickness = 5, fontSize = '0.58rem' }) => (
    <Box role="meter"
         aria-label="Tasks done"
         aria-valuemin={0}
         aria-valuemax={total}
         aria-valuenow={done}
         aria-valuetext={`${done} of ${total} tasks done`}
         sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
        <Box sx={{ flex: 1,
                   minWidth: '1.25rem',
                   height: thickness,
                   borderRadius: thickness / 2,
                   backgroundColor: METER_TRACK,
                   overflow: 'hidden' }}>
            <Box sx={{ width: `${total === 0 ? 0 : (done / total) * 100}%`,
                       height: '100%',
                       borderRadius: thickness / 2,
                       backgroundColor: METER_FILL }} />
        </Box>
        <Box component="span"
             sx={{ fontFamily: MONO,
                    fontSize,
                    color: 'arc.onPaper',
                    flexShrink: 0,
                    fontVariantNumeric: 'tabular-nums' }}>
            {done}/{total}
        </Box>
    </Box>
)

export default ProgressMeter

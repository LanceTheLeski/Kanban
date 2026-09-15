/**
 * ArcExpandingSelector
 *
 * Replaces: ArcExpandingSelector.razor
 *
 * The Blazor version used MudExpansionPanel (an accordion) that rendered a
 * MudList inside when expanded, and cleared it after a collapse delay.
 * The comment in the razor noted that the OptionSelected Action<string> callback
 * "might be wrong" — it was being used where an EventCallback would be more
 * idiomatic in Blazor.
 *
 * In React:
 *  - MudExpansionPanels → MUI Accordion
 *  - The delayed null-clear on collapse (Task.Delay(350)) → CSS transition
 *    handles visual fade; we keep the list mounted but visually hidden via
 *    Accordion's built-in collapse animation, which is cleaner.
 *  - Action<string> OptionSelected → (option: string) => void callback prop
 *  - The "should this be a string that clears after use" comment in Blazor
 *    is resolved here: the parent simply reacts to onSelect and the selector
 *    stays stateless about what was chosen.
 */

import React from 'react'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    List,
    ListItemButton,
    ListItemText,
    Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
    SELECTOR_LIST_MAX_HEIGHT,
    SELECTOR_SUMMARY_MIN_HEIGHT,
} from '../Styles/Measures'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ArcExpandingSelectorProps {
    /** The list of string options to render — mirrors Options: List<string> */
    options: string[]
    /**
     * Called when the user clicks an option — mirrors OptionSelected: Action<string>
     * The Blazor comment flagged this as potentially wrong; here it's correctly
     * typed as a plain callback (not an EventCallback, which had async overhead).
     */
    onSelect: (option: string) => void
    /** Optional placeholder shown on the accordion summary before selection */
    placeholder?: string
    /**
     * If true, the summary updates to show the currently selected value.
     * Useful when this selector drives a visible field (e.g. column selection).
     */
    showSelected?: boolean
}

// ── Component ────────────────────────────────────────────────────────────────

export const ArcExpandingSelector: React.FC<ArcExpandingSelectorProps> = ({
    options,
    onSelect,
    placeholder = '-- Select --',
    showSelected = true,
}) => {
    const [expanded, setExpanded] = React.useState(false)
    const [selected, setSelected] = React.useState<string | null>(null)

    const handleSelect = (option: string) => {
        setSelected(option)
        onSelect(option)
        // Close after selection — more UX-complete than the Blazor version
        // which left the panel open after clicking an item.
        setExpanded(false)
    }

    const summaryLabel =
        showSelected && selected !== null ? selected : placeholder

    return (
        /*
          MudExpansionPanels → Accordion
          MaxHeight="1000" on the Blazor panel → no explicit max needed; MUI
          Accordion handles overflow gracefully.
        */
        <Accordion
            expanded={expanded}
            onChange={(_, isExpanded) => setExpanded(isExpanded)}
            /*
               Engraved, not glass. This selector always renders inside an overlay
               or a popover, which are themselves .glass — and .glass on .glass
               composites two translucent blue gradients and runs backdrop-filter
               twice, which is what made it read as a solid blue slab instead of a
               pane. See the material note in ArcStyles.css.
            */
            className="glass-inner-engraved"
            disableGutters
            elevation={0}
            sx={{
                '&:before': { display: 'none' }, // removes MUI's default top border line
                // !important because MUI's Accordion sets its own radius on the
                // first and last child rules, which are more specific than sx.
                borderRadius: '6px !important',
                overflow: 'hidden',
                // MuiPaper paints background.paper — the theme's solid blue —
                // underneath the engraved gradient. Nothing above can be seen
                // through an opaque layer, so it has to go.
                backgroundColor: 'transparent',
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: 'arc.onGlassIcon' }} />}
                sx={{
                    minHeight: SELECTOR_SUMMARY_MIN_HEIGHT,
                    '& .MuiAccordionSummary-content': { margin: '8px 0' },
                }}
            >
                <Typography
                    variant="body2"
                    sx={{
                        fontFamily: '"DM Mono", monospace',
                        fontSize: '0.8rem',
                        color: selected ? 'arc.onGlassStrong' : 'arc.onGlassMuted',
                    }}
                >
                    {summaryLabel}
                </Typography>
            </AccordionSummary>

            {/*
        MudPaper Style="width: 300px; height: 200px" → AccordionDetails with
        constrained height and overflow scroll, matching the Blazor layout.
      */}
            <AccordionDetails
                sx={{
                    p: 0,
                    maxHeight: SELECTOR_LIST_MAX_HEIGHT,
                    overflowY: 'auto',
                    // px width, themed colour: the rule is chrome, its colour is
                    // part of the glass surface. `borderTop` is a shorthand and
                    // sx does not resolve palette paths inside one, so the colour
                    // is set on its own.
                    borderTop: '1px solid',
                    borderTopColor: 'arc.glassDivider',
                }}
            >
                <List dense disablePadding>
                    {options.map((option) => (
                        <ListItemButton
                            key={option}
                            onClick={() => handleSelect(option)}
                            selected={option === selected}
                            sx={{
                                py: 0.75,
                                px: 2,
                                '&.Mui-selected': {
                                    backgroundColor: 'arc.glassSelected',
                                },
                                '&:hover': {
                                    backgroundColor: 'arc.glassHover',
                                },
                            }}
                        >
                            <ListItemText
                                primary={option}
                                primaryTypographyProps={{
                                    fontFamily: '"DM Mono", monospace',
                                    fontSize: '0.8rem',
                                    color: 'arc.onGlass',
                                }}
                            />
                        </ListItemButton>
                    ))}
                </List>
            </AccordionDetails>
        </Accordion>
    )
}

export default ArcExpandingSelector
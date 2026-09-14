import { createTheme } from '@mui/material/styles'

/**
 * Faithful translation of MyMudThemeProvider.razor
 *
 * The original Blazor file defines two themes:
 *   - _ArcBoardDefaultTheme  (used on Board and Calendar pages)
 *   - _ArcBoardTransparentTheme (defined but not yet implemented in the original)
 *
 * MudBlazor PaletteLight → MUI palette mapping:
 *   BackgroundGray  → background.default   (MUI doesn't have a "BackgroundGray"
 *                                            slot; default is the closest match)
 *   Background      → background.paper
 *   Primary         → primary.main
 *   Secondary       → secondary.main
 *   Tertiary        → No native MUI equivalent. Mapped to success.main.
 *
 * NOTE: The original Blazor theme has NO typography configuration.
 * MudBlazor defaults to Roboto. Typography choices are left unset here so
 * MUI's default (Roboto) applies, matching the original behaviour.
 *
 * The reference colour comment block in the original razor:
 *   #0F83DB  (BackgroundGray / background.default)
 *   #69B4EC  (Background / background.paper)
 *   #2494E7  (Primary)
 *   #F0EDE0  (Secondary)
 *   #B9E0A6  (Tertiary / success)
 */

// ── The arc palette ───────────────────────────────────────────────────────────

/**
 * Every colour the app paints that is not one of MUI's five palette slots.
 *
 * ── Why these moved here ─────────────────────────────────────────────────────
 * They were literals at their point of use: `backgroundColor: 'wheat'` three
 * times in one file, `'#ECED7b'` in the drop cell, `'lightcoral'` on the
 * swimlane label, `'aquamarine'` in two unrelated components meaning two
 * unrelated things. Four consequences, all of which had already started:
 *
 *   - "What colour is a swimlane?" could only be answered by grepping, and the
 *     answer was three literals that had to be kept in step by hand.
 *   - Nothing named the *role*. `'#ECED7b'` says nothing; `cell` says what it
 *     is for, which is the thing you actually need when changing it.
 *   - arcBoardTransparentTheme (below) is stubbed in both the Blazor original
 *     and here. It cannot ever be implemented while the board's colours live
 *     inside the components — a theme can only swap what goes through it.
 *   - The same literal in two places meant two different things. `aquamarine`
 *     is the board title *and* the timeline mode panel; they are now named
 *     separately and can diverge without a search-and-replace hitting both.
 *
 * ── Using them ───────────────────────────────────────────────────────────────
 * MUI resolves a dotted path against `theme.palette` for any colour-scaled sx
 * property, so these are used as strings:
 *
 *     backgroundColor: 'arc.cell'          ✅  resolves palette.arc.cell
 *     borderColor: 'arc.swimlaneBand'      ✅
 *
 * `outline`, `border` and other shorthands are NOT colour-scaled — sx passes
 * them through untouched, so a path in one is written to the DOM verbatim and
 * silently does nothing. For those, take the callback form of sx and read the
 * value off the theme:
 *
 *     sx={theme => ({ outline: `2px solid ${theme.palette.arc.cellActiveEdge}` })}
 *
 * ── Why a custom section rather than more MUI slots ──────────────────────────
 * MUI's slots (primary, error, warning…) carry meaning: components read them,
 * and `color="error"` on a Button expects error.main to be an error colour.
 * None of these are that — they are surfaces particular to this board. Putting
 * them under `arc` keeps them out of the way of components that reason about
 * the standard slots, and makes them obvious as ours at the call site.
 */
export interface ArcPalette {
    // ── Board grid ────────────────────────────────────────────────────────────
    /** The band behind a swimlane row, and the gutters down each side of it. */
    swimlaneBand: string
    /** The row surface the cells sit on. */
    swimlaneSurface: string
    /** The swimlane's name block, down the left of its row. */
    swimlaneLabel: string
    /** A drop cell at rest. */
    cell: string
    /** A drop cell with a card held over it. */
    cellActive: string
    /** The ring drawn round a cell that would accept the drop. */
    cellActiveEdge: string
    /** The "n cards" badge on a cell holding more than it can show. */
    overflowBadge: string
    /** "Honu Boards", above the swimlane labels. */
    boardTitle: string

    // ── Cards ─────────────────────────────────────────────────────────────────
    /** A card tile. */
    cardSurface: string

    // ── Overlay interiors ─────────────────────────────────────────────────────
    /** A text input sitting on glass, which needs its own ground to stay legible. */
    field: string
    /** The same, for the multiline description. */
    fieldMuted: string
    /** The not-yet-implemented tags chip on the card overlay. */
    tagPlaceholder: string
    /** The task popover's panel. */
    taskPanel: string

    // ── On glass ──────────────────────────────────────────────────────────────
    // Glass is a dark translucent surface, so anything drawn on it is a white at
    // some opacity. These were an unnamed ramp inside ArcExpandingSelector —
    // 0.95, 0.9, 0.7, 0.6, 0.2, 0.15, 0.12 — which is exactly the kind of thing
    // the next glass component copies out and then drifts from.
    /** A selected or active label on glass. */
    onGlassStrong: string
    /** Ordinary text on glass. */
    onGlass: string
    /** An icon on glass. */
    onGlassIcon: string
    /** A placeholder, or a label with nothing chosen yet. */
    onGlassMuted: string
    /** A row under the pointer. */
    glassHover: string
    /** The chosen row. */
    glassSelected: string
    /** A rule between sections of a glass panel. */
    glassDivider: string

    // ── Timeline modes ────────────────────────────────────────────────────────
    // Three mutually exclusive panels, each with its own colour. The Blazor
    // original drove these off a `bool?`; the colours are unchanged.
    /** Timeline: full preferred and required ranges. */
    timelineMode: string
    /** Deadline: a single end date and time. */
    deadlineMode: string
    /** Timeless: no dates at all. */
    timelessMode: string
}

/**
 * The values, unchanged from the literals they replace. Named CSS colours are
 * kept as names rather than resolved to hex: that is how the Blazor original
 * wrote them, and `wheat` carries more than `#F5DEB3` does.
 */
const arcSurfaces: ArcPalette = {
    swimlaneBand: 'wheat',
    swimlaneSurface: '#C7EEE6',
    swimlaneLabel: 'lightcoral',
    cell: '#ECED7b',
    cellActive: '#d4f5d4',
    cellActiveEdge: '#4caf50',
    overflowBadge: 'rgba(0, 0, 0, 0.55)',
    boardTitle: 'aquamarine',

    cardSurface: 'lightyellow',

    field: 'rgba(255, 255, 255, 0.6)',
    fieldMuted: 'rgba(255, 255, 230, 0.8)',
    tagPlaceholder: 'rgba(204, 255, 204, 0.6)',
    taskPanel: 'rgba(153, 214, 255, 0.8)',

    onGlassStrong: 'rgba(255, 255, 255, 0.95)',
    onGlass: 'rgba(255, 255, 255, 0.9)',
    onGlassIcon: 'rgba(255, 255, 255, 0.7)',
    onGlassMuted: 'rgba(255, 255, 255, 0.6)',
    glassHover: 'rgba(255, 255, 255, 0.12)',
    glassSelected: 'rgba(255, 255, 255, 0.2)',
    glassDivider: 'rgba(255, 255, 255, 0.15)',

    timelineMode: 'aquamarine',
    deadlineMode: 'lightgoldenrodyellow',
    timelessMode: 'indianred',
}

/**
 * Teaches TypeScript that `palette.arc` exists, so `theme.palette.arc.cell` is
 * checked and a typo in a token name is a build error rather than a silently
 * transparent background.
 *
 * `arc` is required on Palette but optional on PaletteOptions, which is how MUI
 * declares its own slots. That means `createTheme({})` compiles while producing
 * a theme whose `palette.arc` is undefined at runtime — so every theme in this
 * file spreads arcSurfaces in. There is no default to fall back on.
 */
declare module '@mui/material/styles' {
    interface Palette {
        arc: ArcPalette
    }
    interface PaletteOptions {
        arc?: ArcPalette
    }
}

// ── _ArcBoardDefaultTheme ─────────────────────────────────────────────────────

export const arcBoardDefaultTheme = createTheme({
    palette: {
        primary: {
            main: '#2494E7',
        },
        secondary: {
            main: '#F0EDE0',
        },
        success: {
            // Tertiary in MudBlazor has no direct MUI slot.
            // Mapped to success as the closest semantic equivalent.
            main: '#B9E0A6',
        },
        background: {
            default: '#0F83DB', // BackgroundGray
            paper: '#69B4EC', // Background
        },
        arc: arcSurfaces,
    },
})

// ── _ArcBoardTransparentTheme ─────────────────────────────────────────────────
// In the original razor this theme has empty PaletteLight and LayoutProperties
// blocks — it was stubbed out but not yet implemented.
//
// It now at least starts from somewhere: it carries the same arc surfaces, so
// implementing it is a matter of overriding the entries that should differ
// rather than first having to find where the colours are. That was not possible
// while they were literals inside the components.

export const arcBoardTransparentTheme = createTheme({
    palette: {
        arc: arcSurfaces,
    },
})

// ── Default export ────────────────────────────────────────────────────────────
// App.tsx uses this, matching how Board.razor and Calendar.razor both reference
// MyMudThemeProvider._ArcBoardDefaultTheme.

export const arcTheme = arcBoardDefaultTheme

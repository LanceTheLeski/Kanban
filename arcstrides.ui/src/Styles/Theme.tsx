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
    // The wall itself is .board-surface in ArcStyles.css, because it is a woven
    // texture rather than a colour. What is left here is the chrome around it.
    /** The gutters down each side of a swimlane row. */
    swimlaneBand: string
    /** The bar marking a swimlane's name block. */
    swimlaneLabel: string
    /** The ring drawn round a cell that would accept the drop. */
    cellActiveEdge: string
    /** The "n cards" badge on a cell holding more than it can show. */
    overflowBadge: string
    /** "Honu Boards", above the swimlane labels. */
    boardTitle: string

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
    /**
     * The timeline rail's connecting line.
     *
     * Stronger than paperDivider, which a rule between sections gets: a divider
     * separates two things and should barely register, while this line *is* the
     * timeline and is the first thing the panel should say.
     */
    railLine: string
    /**
     * The fill of a rail node with no date.
     *
     * Not transparent: the connecting line would run straight through the dot
     * and it would stop reading as a point on the rail. Filled with the card's
     * own colour instead, so an unset node reads as a hole punched in the line —
     * which is what an unset point is.
     */
    railNodeEmpty: string
    /**
     * A destructive action on the engraved bar.
     *
     * MUI's error.main is a dark red, chosen to sit on white. On the bar's dark
     * slate it is two dark colours on top of each other — "Delete Column" was
     * measurably the least readable thing in the overlay. This is the same hue
     * lifted to where it reads on a dark ground.
     */
    dangerOnGlass: string
    /** The primary action on the engraved bar. */
    accentOnGlass: string

    // ── On card stock ─────────────────────────────────────────────────────────
    // The mirror of the "on glass" ramp above, for the panels that are pieces of
    // card rather than recesses in the pane (see .card-stock in ArcStyles.css).
    // Glass is dark, so everything on it is a white at some opacity; card is
    // light, so everything on it is a warm near-black at some opacity. The two
    // ramps have to be separate because neither one degrades into the other:
    // white-at-60% on card is invisible, and this ramp on glass is unreadable.
    /** A heading, or the value a panel exists to show. */
    onPaperStrong: string
    /** Ordinary text on card. */
    onPaper: string
    /** A label, a placeholder, a timestamp — present but not being read. */
    onPaperMuted: string
    /** A row under the pointer. */
    paperHover: string
    /** The chosen row. */
    paperSelected: string
    /** A rule between sections of a card panel. */
    paperDivider: string
    /** A text input's ground, one step down from the card it sits on. */
    paperField: string
    /** The primary action, and anything that is the point of its panel. */
    paperAccent: string
    /** A destructive action on card. */
    paperDanger: string

    // ── Card commands ─────────────────────────────────────────────────────────
    // One accent per CardCommandKind — command, result, error. They read as a
    // set deliberately: the panel is scanned down its left edge, and the
    // colour is what tells a command from what it answered.
    //
    // These were a set of pale tints chosen for a dark glass panel. The panel is
    // card now, so they are the same five hues taken to where they read on it —
    // a pale tint on off-white is a colour you can see but not name, which is
    // the one thing an accent set cannot afford.
    /** A command the user typed. */
    logCommand: string
    /** What a command answered. */
    logResult: string
    /** Something wanting attention: a deadline passed, a write rejected. */
    logAlert: string

    // ── Timeline modes ────────────────────────────────────────────────────────
    // Three mutually exclusive modes, each with its own colour, used both as a
    // selected button's fill and as an unselected one's outline.
    //
    // The Blazor original's aquamarine / lightgoldenrodyellow / indianred were
    // chosen against a dark panel, where a pale tint is the thing that stands
    // out. The panel is card stock now, and the first render of it showed what
    // that costs: `lightgoldenrodyellow` as a 1px outline on off-white is not a
    // faint button, it is no button — the Deadline control had visibly vanished.
    //
    // Same three hues, taken to a value that reads on card and still takes black
    // text when selected.
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
    swimlaneBand: '#b9ae97',
    swimlaneLabel: 'lightcoral',
    cellActiveEdge: '#3f8f4a',
    overflowBadge: 'rgba(0, 0, 0, 0.55)',
    boardTitle: 'aquamarine',

    onGlassStrong: 'rgba(255, 255, 255, 0.95)',
    onGlass: 'rgba(255, 255, 255, 0.9)',
    onGlassIcon: 'rgba(255, 255, 255, 0.7)',
    onGlassMuted: 'rgba(255, 255, 255, 0.6)',
    glassHover: 'rgba(255, 255, 255, 0.12)',
    glassSelected: 'rgba(255, 255, 255, 0.2)',
    glassDivider: 'rgba(255, 255, 255, 0.15)',
    railLine: 'rgba(52, 36, 20, 0.38)',
    railNodeEmpty: 'var(--arc-paper)',
    dangerOnGlass: '#ff8a80',
    accentOnGlass: '#9ad9ff',

    onPaperStrong: '#22262c',
    onPaper: '#2c3641',
    onPaperMuted: '#5a6572',
    paperHover: 'rgba(52, 36, 20, 0.07)',
    paperSelected: 'rgba(52, 36, 20, 0.12)',
    paperDivider: 'rgba(52, 36, 20, 0.18)',
    paperField: 'rgba(255, 255, 255, 0.55)',
    paperAccent: '#2d6f9c',
    paperDanger: '#a6392c',

    logCommand: '#1d5c86',
    logResult: '#2c6a51',
    logAlert: '#a6392c',

    timelineMode: '#5fc7ac',
    deadlineMode: '#d8bc5a',
    timelessMode: '#cd5c5c',
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

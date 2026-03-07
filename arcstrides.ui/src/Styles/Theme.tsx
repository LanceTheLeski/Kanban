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
 *   Tertiary        → No native MUI equivalent. Exposed as a CSS variable
 *                     (--arc-tertiary) and mapped to success.main so it remains
 *                     accessible via the theme object if needed.
 *
 * NOTE: The original Blazor theme has NO typography configuration.
 * MudBlazor defaults to Roboto. Typography choices are left unset here so
 * MUI's default (Roboto) applies, matching the original behaviour.
 * Add a typography block here when you're ready to define fonts for the
 * React project.
 *
 * The reference colour comment block in the original razor:
 *   #0F83DB  (BackgroundGray / background.default)
 *   #69B4EC  (Background / background.paper)
 *   #2494E7  (Primary)
 *   #F0EDE0  (Secondary)
 *   #B9E0A6  (Tertiary / success)
 */

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
    },
})

// ── _ArcBoardTransparentTheme ─────────────────────────────────────────────────
// In the original razor this theme has empty PaletteLight and LayoutProperties
// blocks — it was stubbed out but not yet implemented.
// Preserved here as an empty theme so references to it don't break as you
// build it out.

export const arcBoardTransparentTheme = createTheme({
    // TODO: implement when the transparent theme is defined in the original project
})

// ── Default export ────────────────────────────────────────────────────────────
// App.tsx uses this, matching how Board.razor and Calendar.razor both reference
// MyMudThemeProvider._ArcBoardDefaultTheme.

export const arcTheme = arcBoardDefaultTheme
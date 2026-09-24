/**
 * App.tsx
 *
 * Root application shell with routing.
 *
 * Provider stack (outermost → innermost):
 *   BrowserRouter      — React Router, reads the URL
 *   ThemeProvider      — MUI theme (arcTheme / arcBoardDefaultTheme)
 *   LocalizationProvider — required by @mui/x-date-pickers (DatePicker, TimePicker)
 *   ArcErrorDisplay    — notistack SnackbarProvider + useArcError hook
 *   Routes             — renders the matched page
 *
 * Routes:
 *   /                   → redirect to the demo board (a board picker is still to come)
 *   /board/:boardId     → BoardPage, inside AppLayout (mirrors MainLayout.razor)
 *   /calendar           → redirect to the demo month (the API cannot yet look a
 *                         month up by year and month — see docs/api-gaps.md)
 *   /calendar/:monthId  → CalendarPage
 *
 * The BrowserRouter lives here rather than in main.tsx so that App.tsx stays
 * self-contained and testable. If you later need a MemoryRouter for tests you
 * only change this file.
 */

import { ThemeProvider, CssBaseline, StyledEngineProvider } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ArcErrorDisplay } from './Components/ArcErrorDisplay'
import { arcTheme } from './Styles/Theme'
import { AppLayout } from './Layouts/AppLayout'
import { BoardPage } from './Pages/BoardPage'
import { CalendarPage } from './Pages/CalendarPage'
import './Styles/ArcStyles.css'

function App() {
    return (
        <BrowserRouter>
            {/*
              injectFirst puts MUI's generated styles at the TOP of <head>, ahead of
              ArcStyles.css, so our own stylesheet wins on equal specificity.

              Without it MUI loses the race by default — emotion injects at render
              time, after an imported CSS file has already been applied — and it was
              quietly overriding the ported Blazor glass. On the board's Paper, MUI's
              class replaced the transparent background with the theme's solid blue
              and elevation={0} set box-shadow: none, which erased the entire inset
              highlight stack. The gradients survived, so it still looked deliberate:
              a flat blue slab rather than glass.

              This is MUI's documented answer to plain CSS being overridden, and it
              fixes the whole ported stylesheet at once rather than glass alone. The
              trade-off is that sx no longer outranks a class in ArcStyles.css, so a
              component wanting to depart from .glass should stop using the class
              rather than try to out-specify it.
            */}
            <StyledEngineProvider injectFirst>
            <ThemeProvider theme={arcTheme}>
                <CssBaseline />
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <ArcErrorDisplay>
                        <Routes>
                            {/* AppLayout is the shell every page renders inside — mirrors
                  DefaultLayout="@typeof(Layouts.MainLayout)" in Routes.razor */}
                            <Route element={<AppLayout />}>
                                {/*
                    / → redirect to the demo board ID for now.
                    Replace with a real HomePage (board picker) later.
                  */}
                                <Route path="/"
                                       element={<Navigate to="/board/1cb0ce6e-6145-4fe7-833a-0b7c0545c449" replace />} />

                                {/* /board/:boardId — the main Kanban board */}
                                <Route path="/board/:boardId" element={<BoardPage />} />

                                {/*
                    /calendar → the month the Blazor calendar hard-coded, for
                    the same reason / goes to the demo board.
                  */}
                                <Route path="/calendar"
                                       element={<Navigate to="/calendar/6469d898-c468-4c84-82f9-6dcad60757a8" replace />} />

                                <Route path="/calendar/:monthId" element={<CalendarPage />} />

                                {/* Catch-all — send unknown URLs back to root */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Route>
                        </Routes>
                    </ArcErrorDisplay>
                </LocalizationProvider>
            </ThemeProvider>
            </StyledEngineProvider>
        </BrowserRouter>
    )
}

export default App
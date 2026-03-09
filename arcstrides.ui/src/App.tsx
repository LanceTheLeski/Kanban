/**
 * App.tsx
 *
 * Root application shell with routing.
 *
 * Provider stack (outermost → innermost):
 *   BrowserRouter      — React Router, reads the URL
 *   ThemeProvider      — MUI theme (arcBoardDefaultTheme)
 *   LocalizationProvider — required by @mui/x-date-pickers (DatePicker, TimePicker)
 *   ArcErrorDisplay    — notistack SnackbarProvider + useArcError hook
 *   Routes             — renders the matched page
 *
 * Routes:
 *   /              → HomePage (stub — board picker)
 *   /board/:boardId → BoardPage
 *
 * The BrowserRouter lives here rather than in main.tsx so that App.tsx stays
 * self-contained and testable. If you later need a MemoryRouter for tests you
 * only change this file.
 */

import { ThemeProvider, CssBaseline } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ArcErrorDisplay } from './Components/ArcErrorDisplay'
import { arcTheme } from './Styles/Theme'
import { BoardPage } from './Pages/BoardPage'
import './Styles/ArcStyles.css'

function App() {
    return (
        <BrowserRouter>
            <ThemeProvider theme={arcTheme}>
                <CssBaseline />
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <ArcErrorDisplay>
                        <Routes>
                            {/*
                / → redirect to the demo board ID for now.
                Replace with a real HomePage (board picker) later.
              */}
                            <Route
                                path="/"
                                element={<Navigate to="/board/1cb0ce6e-6145-4fe7-833a-0b7c0545c449" replace />}
                            />

                            {/* /board/:boardId — the main Kanban board */}
                            <Route path="/board/:boardId" element={<BoardPage />} />

                            {/* Catch-all — send unknown URLs back to root */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </ArcErrorDisplay>
                </LocalizationProvider>
            </ThemeProvider>
        </BrowserRouter>
    )
}

export default App
/**
 * BoardPage
 *
 * Mirrors: Pages/Board.razor + Pages/Board.cs
 *
 * Route: /board/:boardId. boardId replaces the hardcoded
 * Guid.Parse("1cb0ce6e-...") from Blazor; useParams() reads it.
 *
 * ── What this file is for ────────────────────────────────────────────────────
 * Four things, and deliberately nothing else: read the route, ask the store to
 * load, decide between loading / error / board, and put the frame round it.
 *
 * It used to be 550 lines, holding the drop cell, the draggable card, the header
 * row, the swimlane row and the whole drag lifecycle as well. Everything on that
 * list changes for its own reasons — the responsive pass rewrote the geometry
 * without touching the drag handlers, and the move to ID-addressed cells rewrote
 * the drag handlers without touching the geometry — but while they shared a file
 * every one of those changes had to be made while scrolling past the others.
 *
 * They now live under Features/Board/Grid, one concern per file:
 *
 *   BoardGrid          the scroll container, the headers, the rows, the DndContext
 *   ColumnHeaderRow    the strip of column titles
 *   SwimlaneRow        one swimlane: its label and its cells
 *   DroppableCell      one column × swimlane intersection
 *   DraggableCard      a card with drag behaviour attached
 *   useCardDrag        pick up, drop, patch, roll back on failure
 *   Board.Cells        how a card is addressed to a cell
 *
 * ── Data loading ─────────────────────────────────────────────────────────────
 * Blazor used OnInitializedAsync(), which ran once on first render. The effect
 * below just asks the store to load; the fetch, the response mapping and the
 * loading/error status all live in Board.Store.ts.
 */

import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material'
import { useShallow } from 'zustand/react/shallow'
import { BoardManagementNav } from '../Features/Board/BoardManagementNav'
import { BoardGrid } from '../Features/Board/Grid/BoardGrid'
import { useBoardStore } from '../Features/Board/Board.Store'

export const BoardPage: React.FC = () => {
    const { boardId } = useParams<{ boardId: string }>()

    const { status, error, loadBoard } = useBoardStore(
        useShallow(state => ({
            status: state.status,
            error: state.error,
            loadBoard: state.loadBoard,
        })),
    )

    // Mirrors Blazor's OnInitializedAsync()
    useEffect(() => {
        if (boardId) loadBoard(boardId)
    }, [boardId, loadBoard])

    if (status === 'loading' || status === 'idle') {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        )
    }

    if (status === 'error') {
        return (
            <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Typography color="error">Failed to load board: {error}</Typography>
                <Button variant="outlined" onClick={() => boardId && loadBoard(boardId)}>
                    Retry
                </Button>
            </Box>
        )
    }

    return (
        // Mirrors: MudPaper Style="background-color: transparent" Width="100%" Height="100%"
        <Box sx={{ width: '100%', minHeight: '100vh', backgroundColor: 'transparent', textAlign: 'center' }}>
            {/* Mirrors: MudPaper Class="glass" Width="92%" */}
            <Paper className="glass" sx={{ width: '92%', mx: 'auto' }} elevation={0}>
                {/* Mirrors: MudPaper Height="50px" Width="100%" Class="mud-theme-primary" */}
                <Box sx={{ width: '100%' }}>
                    <BoardManagementNav />
                </Box>

                {/*
                    `status` is 'ready' by here, so boardId is set — the load effect
                    is the only thing that can move the store out of 'idle'.
                */}
                <BoardGrid boardId={boardId!} />
            </Paper>
        </Box>
    )
}

export default BoardPage

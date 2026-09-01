/**
 * BoardPage
 *
 * Mirrors: Pages/Board.razor + Pages/Board.cs
 *
 * ── Routing ───────────────────────────────────────────────────────────────────
 * Route: /board/:boardId
 * boardId replaces the hardcoded Guid.Parse("1cb0ce6e-...") from Blazor.
 * useParams() reads it — the React equivalent of a route parameter.
 *
 * ── Data loading ─────────────────────────────────────────────────────────────
 * Blazor used OnInitializedAsync() which ran once on first render. Here the
 * effect just asks the store to load; the fetch, the response mapping and the
 * loading/error status all live in BoardStores.ts so this file only renders.
 *
 * ── Grid layout ───────────────────────────────────────────────────────────────
 * Blazor rendered:
 *   1. BoardManagementNavigationBar (toolbar)
 *   2. A header row: "Honu Boards" label + one cell per column title
 *   3. MudDropContainer > per-swimlane rows > per-column MudDropZones
 *   4. UpdateCardOverlay (now owned by BoardCard, no longer here)
 *
 * ── Which cell does a card belong in? ─────────────────────────────────────────
 * Blazor's MudDropContainer used ItemsSelector="@((card, dropzone) => card.DropArea
 * == dropzone)", matching a "{swimlaneOrder}_{columnOrder}" string stored on each
 * card. That string went stale the moment a column or swimlane was reordered or
 * deleted, because nothing recomputed it.
 *
 * Cards now carry columnId/swimlaneId and the cell is matched on those instead —
 * IDs don't shift when orders do. The dnd-kit droppable id encodes the same pair
 * so a drop knows exactly where it landed.
 *
 * ── Drag and drop ─────────────────────────────────────────────────────────────
 * MudDropContainer + MudDropZone → dnd-kit DndContext + useDroppable/useDraggable.
 * DragOverlay renders the ghost card that follows the cursor, replacing the
 * built-in preview MudDropZone provided.
 *
 * The onDragEnd handler mirrors Blazor's UpdateCard(): resolve the target cell,
 * move the card in the store, then PATCH. If the PATCH fails the move is rolled
 * back and the error is surfaced, rather than leaving the UI out of sync.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material'
import {
    DndContext,
    DragOverlay,
    type DragEndEvent,
    type DragStartEvent,
    PointerSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { BoardManagementNav } from '../Features/Board/BoardManagementNav'
import { BoardCard } from '../Features/Board/BoardCard'
import { moveCard } from '../APIs/Board.APIs'
import { useArcError } from '../Components/useArcError'
import { useShallow } from 'zustand/react/shallow'
import { useBoardStore } from '../Stores/BoardStores'
import type { Card } from '../Types/Board.Types'

// ── Cell identifiers ──────────────────────────────────────────────────────────

/**
 * A drop cell is addressed by the pair of IDs that define it. Using IDs rather
 * than the old order-based "0_2" string means the identifier stays valid across
 * reorders. The separator is a character that cannot appear in a GUID.
 */
const cellId = (swimlaneId: string, columnId: string) => `${swimlaneId}|${columnId}`

const parseCellId = (id: string): { swimlaneId: string; columnId: string } | null => {
    const [swimlaneId, columnId] = id.split('|')
    if (!swimlaneId || !columnId) return null
    return { swimlaneId, columnId }
}

// ── DroppableCell ─────────────────────────────────────────────────────────────

/**
 * A single drop zone cell in the grid.
 * Mirrors MudDropZone Identifier="@identifier" with CanDropClass="mud-border-success".
 */
const DroppableCell: React.FC<{
    identifier: string
    children: React.ReactNode
}> = ({ identifier, children }) => {
    const { setNodeRef, isOver } = useDroppable({ id: identifier })

    return (
        <Box
            ref={setNodeRef}
            sx={{
                width: 300,
                height: 200,
                backgroundColor: isOver ? '#d4f5d4' : '#ECED7b',
                display: 'flex',
                flexWrap: 'wrap',
                alignContent: 'flex-start',
                gap: 1,
                p: 1,
                overflowY: 'auto',
                outline: isOver ? '2px solid #4caf50' : '2px solid transparent',
                transition: 'background-color 0.15s, outline 0.15s',
            }}
        >
            {children}
        </Box>
    )
}

// ── DraggableCard ─────────────────────────────────────────────────────────────

/**
 * Wraps BoardCard with dnd-kit drag behaviour.
 * Mirrors MudDropContainer's ItemRenderer, which made each DropCard draggable.
 *
 * Only the drag handle strip carries the pointer listeners — putting them on the
 * whole tile would swallow clicks on the Actions and Remove buttons.
 */
const DraggableCard: React.FC<{ card: Card; boardId: string }> = ({ card, boardId }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id })

    return (
        <Box ref={setNodeRef} sx={{ opacity: isDragging ? 0.4 : 1 }}>
            <BoardCard
                card={card}
                boardId={boardId}
                dragHandleProps={{ ...listeners, ...attributes }}
            />
        </Box>
    )
}

// ── BoardPage ─────────────────────────────────────────────────────────────────

export const BoardPage: React.FC = () => {
    const { boardId } = useParams<{ boardId: string }>()
    const { addError } = useArcError()
    const [draggingCard, setDraggingCard] = useState<Card | null>(null)

    const { status, error, columns, swimlanes, cards, loadBoard, applyCardMove, restoreCard } =
        useBoardStore(useShallow(state => ({
            status: state.status,
            error: state.error,
            columns: state.columns,
            swimlanes: state.swimlanes,
            cards: state.cards,
            loadBoard: state.loadBoard,
            applyCardMove: state.applyCardMove,
            restoreCard: state.restoreCard,
        })))

    // dnd-kit sensors — PointerSensor activates after an 8px drag distance,
    // preventing accidental drags when clicking card buttons
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    )

    // ── Data loading ────────────────────────────────────────────────────────────
    // Mirrors Blazor's OnInitializedAsync()
    useEffect(() => {
        if (boardId) loadBoard(boardId)
    }, [boardId, loadBoard])

    // ── Card lookup by cell ─────────────────────────────────────────────────────
    // Built once per card list rather than filtering the whole array inside every
    // one of the (columns × swimlanes) cells.
    const cardsByCell = useMemo(() => {
        const groups = new Map<string, Card[]>()

        for (const card of cards) {
            const key = cellId(card.swimlaneId, card.columnId)
            const group = groups.get(key)
            if (group) group.push(card)
            else groups.set(key, [card])
        }

        return groups
    }, [cards])

    // ── Drag handlers ───────────────────────────────────────────────────────────
    const handleDragStart = (event: DragStartEvent) => {
        setDraggingCard(cards.find(card => card.id === String(event.active.id)) ?? null)
    }

    // Mirrors Blazor's UpdateCard(MudItemDropInfo<DropCard> cardToUpdate)
    const handleDragEnd = async (event: DragEndEvent) => {
        setDraggingCard(null)

        const { active, over } = event
        if (!over || !boardId) return

        const target = parseCellId(String(over.id))
        if (!target) return

        const cardId = String(active.id)
        const card = cards.find(candidate => candidate.id === cardId)
        if (!card) return

        // Nothing to do when the card was dropped back where it started
        if (card.columnId === target.columnId && card.swimlaneId === target.swimlaneId) return

        const column = columns.find(candidate => candidate.id === target.columnId)
        const swimlane = swimlanes.find(candidate => candidate.id === target.swimlaneId)
        if (!column || !swimlane) return

        // Move locally first so the card follows the cursor's drop immediately
        const previous = applyCardMove(cardId, column, swimlane)
        if (!previous) return

        try {
            // Mirrors Board.cs SendCardPatchRequest() — patches the card's position row
            await moveCard(boardId, card.positionId, {
                columnId: column.id,
                columnTitle: column.title,
                columnOrder: column.order,
                swimlaneId: swimlane.id,
                swimlaneTitle: swimlane.title,
                swimlaneOrder: swimlane.order,
            })
        } catch (moveError) {
            // Put the card back where it was — the server never accepted the move
            restoreCard(previous)
            const message = moveError instanceof Error ? moveError.message : String(moveError)
            addError(`Moving "${card.title}" failed: ${message}`)
        }
    }

    // ── Loading / error states ──────────────────────────────────────────────────
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

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        // Mirrors: MudPaper Style="background-color: transparent" Width="100%" Height="100%"
        <Box sx={{ width: '100%', minHeight: '100vh', backgroundColor: 'transparent', textAlign: 'center' }}>

            {/* Mirrors: MudPaper Class="glass" Width="92%" */}
            <Paper className="glass" sx={{ width: '92%', mx: 'auto' }} elevation={0}>

                {/* ── Toolbar ─────────────────────────────────────────────────────── */}
                {/* Mirrors: MudPaper Height="50px" Width="100%" Class="mud-theme-primary" */}
                <Box sx={{ width: '100%' }}>
                    <BoardManagementNav />
                </Box>

                {/*
          The grid scrolls sideways as a unit so the column headers stay lined up
          with the cells beneath them — the header row and the swimlane rows are
          the same width and share one horizontal scroll container.
        */}
                <Box sx={{ overflowX: 'auto' }}>
                    <Box sx={{ display: 'inline-flex', flexDirection: 'column', minWidth: '100%' }}>

                        {/* ── Column header row ────────────────────────────────────── */}
                        <Box sx={{ height: 70, display: 'flex', alignItems: 'center' }}>
                            {/* "Honu Boards" label — mirrors Blazor's Freestyle Script styled MudText */}
                            <Paper
                                elevation={0}
                                sx={{
                                    width: 120,
                                    height: 40,
                                    backgroundColor: 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    pl: 1.5,
                                    flexShrink: 0,
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontFamily: "'Freestyle Script', cursive",
                                        fontWeight: 'bold',
                                        fontSize: '1.6rem',
                                        color: 'aquamarine',
                                    }}
                                >
                                    Honu Boards
                                </Typography>
                            </Paper>

                            {/* Column title cells — one per column */}
                            {columns.map(column => (
                                <Paper
                                    key={column.id}
                                    sx={{
                                        width: 300,
                                        height: 55,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        ml: 1,
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontFamily: "'Calibri Condensed', 'Bodoni MT Condensed', 'Bahnschrift Light Condensed', sans-serif",
                                            fontSize: 'small',
                                            fontWeight: 'bold',
                                            color: 'black',
                                        }}
                                    >
                                        {column.title}
                                    </Typography>
                                </Paper>
                            ))}
                        </Box>

                        {/* ── Kanban grid ───────────────────────────────────────────── */}
                        {/* DndContext wraps all rows — mirrors <MudDropContainer> */}
                        <DndContext
                            sensors={sensors}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDragCancel={() => setDraggingCard(null)}
                        >
                            {swimlanes.map(swimlane => (
                                // Mirrors: foreach rowIndex + MudPaper Style="background-color: wheat"
                                <Box key={swimlane.id} sx={{ backgroundColor: 'wheat' }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            backgroundColor: '#C7EEE6',
                                            borderLeft: '5px solid wheat',
                                            borderRight: '5px solid wheat',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'flex-start' }}>

                                            {/* Swimlane label */}
                                            {/* Mirrors: MudPaper Width="110px" Style="background-color: lightcoral" */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 250, flexShrink: 0 }}>
                                                <Paper
                                                    sx={{
                                                        width: 110,
                                                        backgroundColor: 'lightcoral',
                                                        ml: 1.25,
                                                    }}
                                                >
                                                    <Typography
                                                        align="center"
                                                        sx={{
                                                            fontFamily: "'Calibri Condensed', sans-serif",
                                                            fontSize: 'small',
                                                            fontWeight: 'bold',
                                                            color: 'black',
                                                        }}
                                                    >
                                                        {swimlane.title}
                                                    </Typography>
                                                </Paper>
                                            </Box>

                                            {/* Drop zone cells — one per column */}
                                            {columns.map(column => {
                                                const identifier = cellId(swimlane.id, column.id)
                                                const cellCards = cardsByCell.get(identifier) ?? []

                                                return (
                                                    // Mirrors: MudItem Style="height: 250px" > MudDropZone
                                                    <Box key={column.id} sx={{ height: 250, flexShrink: 0, p: 1.25 }}>
                                                        <DroppableCell identifier={identifier}>
                                                            {cellCards.map(card => (
                                                                <DraggableCard
                                                                    key={card.id}
                                                                    card={card}
                                                                    boardId={boardId!}
                                                                />
                                                            ))}
                                                        </DroppableCell>
                                                    </Box>
                                                )
                                            })}
                                        </Box>
                                    </Paper>
                                </Box>
                            ))}

                            {/*
                The card that follows the cursor mid-drag. MudDropZone drew this
                for us; dnd-kit needs it declared explicitly.
              */}
                            <DragOverlay>
                                {draggingCard && (
                                    <BoardCard card={draggingCard} boardId={boardId!} preview />
                                )}
                            </DragOverlay>
                        </DndContext>
                    </Box>
                </Box>
            </Paper>
        </Box>
    )
}

export default BoardPage

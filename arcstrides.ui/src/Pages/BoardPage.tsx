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
 * Blazor used OnInitializedAsync() which ran once on first render.
 * React equivalent: useEffect with [] dependency array.
 *
 * The Blazor ConvertBoardResponseToDropCardList() method populated four parallel
 * lists (_cards, _columns, _columnTitles, _swimlanes, _swimlaneTitles).
 * Here we call the Zustand store setters (setCards, setColumns, setSwimlanes)
 * directly — no parallel list alignment needed since our types carry all fields.
 *
 * ── Grid layout ───────────────────────────────────────────────────────────────
 * Blazor rendered:
 *   1. BoardManagementNavigationBar (toolbar)
 *   2. A header row: "Honu Boards" label + one cell per column title
 *   3. MudDropContainer > per-swimlane rows > per-column MudDropZones
 *   4. UpdateCardOverlay (now owned by BoardCard, no longer here)
 *
 * The MudDropContainer's ItemsSelector="@((card, dropzone) => card.DropArea == dropzone)"
 * simply filtered cards into their cell by dropArea string match.
 * We replicate this with a plain filter: cards.filter(c => c.dropArea === identifier).
 *
 * ── Drag and drop ─────────────────────────────────────────────────────────────
 * MudDropContainer + MudDropZone → dnd-kit DndContext + useDroppable/useDraggable.
 *
 * dnd-kit is installed (package.json) but the full drag interaction is a
 * significant feature in itself and is stubbed here. The structure is complete:
 *   - DndContext wraps the grid with an onDragEnd handler
 *   - Each drop zone cell is a DroppableCell (useDroppable)
 *   - Each BoardCard is wrapped in a DraggableCard (useDraggable)
 *
 * The onDragEnd handler mirrors Blazor's UpdateCard():
 *   1. Parse new column/swimlane from the drop zone identifier
 *   2. Call moveCard API (PATCH)
 *   3. Update store via moveCard() action
 *
 * To enable visual drag feedback, add <DragOverlay> inside DndContext and render
 * a ghost card. This is the main remaining piece to make DnD fully functional.
 *
 * ── Card tasks ordering ───────────────────────────────────────────────────────
 * Blazor sorted tasks by Order in OnInitializedAsync.
 * We sort during the board response → store conversion below.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, CircularProgress, Paper, Typography } from '@mui/material'
import {
    DndContext,
    type DragEndEvent,
    PointerSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { BoardManagementNav } from '../Features/Board/BoardManagementNav'
import { BoardCard } from '../Features/Board/BoardCard'
import { fetchBoard, moveCard } from '../APIs/Board.APIs'
import { useShallow } from 'zustand/react/shallow'
import { useBoardStore } from '../Stores/BoardStores'
import type { DropCard } from '../Types/Board.Types'

// ── DroppableCell ─────────────────────────────────────────────────────────────

/**
 * A single drop zone cell in the grid.
 * Mirrors MudDropZone Identifier="@identifier".
 *
 * identifier format: "{swimlaneOrder}_{columnOrder}" — same as Blazor.
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
                gap: 1,
                p: 1,
                overflowY: 'auto',
                // Mirrors MudDropZone CanDropClass="mud-border-success"
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
 * Mirrors MudDropContainer's ItemRenderer which made each DropCard draggable.
 */
const DraggableCard: React.FC<{
    dropCard: DropCard
    boardId: string
    onUpdated: (updated: DropCard) => void
    onDeleted: (cardId: string) => void
}> = ({ dropCard, boardId, onUpdated, onDeleted }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: dropCard.card.id,
        data: { dropCard },
    })

    return (
        <Box
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            sx={{
                opacity: isDragging ? 0.4 : 1,
                transform: transform
                    ? `translate(${transform.x}px, ${transform.y}px)`
                    : undefined,
                cursor: 'grab',
                touchAction: 'none', // required by dnd-kit for mobile
            }}
        >
            <BoardCard
                dropCard={dropCard}
                boardId={boardId}
                onUpdated={onUpdated}
                onDeleted={onDeleted}
            />
        </Box>
    )
}

// ── BoardPage ─────────────────────────────────────────────────────────────────

export const BoardPage: React.FC = () => {
    const { boardId } = useParams<{ boardId: string }>()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const { setBoardId, setColumns, setSwimlanes, setCards, columns, swimlanes, cards, moveCard: moveCardInStore } =
        useBoardStore(useShallow(s => ({
            setBoardId: s.setBoardId,
            setColumns: s.setColumns,
            setSwimlanes: s.setSwimlanes,
            setCards: s.setCards,
            columns: s.columns,
            swimlanes: s.swimlanes,
            cards: s.cards,
            moveCard: s.moveCard,
        })))

    // dnd-kit sensors — PointerSensor activates after a 8px drag distance,
    // preventing accidental drags when clicking card buttons
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    )

    // ── Data loading ────────────────────────────────────────────────────────────
    // Mirrors Blazor's OnInitializedAsync()
    useEffect(() => {
        if (!boardId) return

        setLoading(true)
        fetchBoard(boardId)
            .then(response => {
                setBoardId(response.id)

                // Mirrors ConvertBoardResponseToDropCardList() — populates store from response
                setColumns(
                    response.columns.map(c => ({ id: c.id, title: c.title, order: c.order }))
                )
                setSwimlanes(
                    response.swimlanes.map(s => ({ id: s.id, title: s.title, order: s.order }))
                )

                const dropCards = response.cards.map(c => ({
                    dropArea: `${c.swimlaneOrder}_${c.columnOrder}`,
                    card: {
                        id: c.id,
                        positionId: c.positionId,
                        title: c.title,
                        description: c.description,
                        columnId: c.columnId,
                        columnName: c.columnTitle,
                        columnNumber: c.columnOrder,
                        swimlaneId: c.swimlaneId,
                        swimlaneName: c.swimlaneTitle,
                        swimlaneNumber: c.swimlaneOrder,
                        // Sort tasks by order on load — mirrors Blazor's OrderBy(task => task.Order)
                        tasks: [...c.tasks].sort((a, b) => a.order - b.order),
                        timeline: c.timeline,
                    },
                }))

                setCards(dropCards)
            })
            .catch(err => setError(String(err)))
            .finally(() => setLoading(false))
    }, [boardId])

    // ── Drag end handler ────────────────────────────────────────────────────────
    // Mirrors Blazor's UpdateCard(MudItemDropInfo<DropCard> cardToUpdate)
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || !boardId) return

        // over.id is the drop zone identifier: "{swimlaneOrder}_{columnOrder}"
        const newDropArea = String(over.id)
        const cardId = String(active.id)

        const draggedDropCard = cards.find(dc => dc.card.id === cardId)
        if (!draggedDropCard || draggedDropCard.dropArea === newDropArea) return

        // Parse new position from identifier — mirrors ConvertCardAreaToColumnAndSwimlane()
        const [swimlaneOrderStr, columnOrderStr] = newDropArea.split('_')
        const newColumn = columns.find(c => c.order === parseInt(columnOrderStr, 10))
        const newSwimlane = swimlanes.find(s => s.order === parseInt(swimlaneOrderStr, 10))
        if (!newColumn || !newSwimlane) return

        // Update store immediately (optimistic) — mirrors Blazor's direct field mutations
        moveCardInStore(cardId, newDropArea, newColumn, newSwimlane)

        // Send PATCH to server — mirrors Board.cs SendCardPatchRequest()
        await moveCard(boardId, draggedDropCard.card.positionId, {
            columnId: newColumn.id,
            columnTitle: newColumn.title,
            columnOrder: newColumn.order,
            swimlaneId: newSwimlane.id,
            swimlaneTitle: newSwimlane.title,
            swimlaneOrder: newSwimlane.order,
        })
    }

    const handleCardUpdated = (updated: DropCard) => {
        setCards(cards.map(dc => dc.card.id === updated.card.id ? updated : dc))
    }

    const handleCardDeleted = (cardId: string) => {
        setCards(cards.filter(dc => dc.card.id !== cardId))
    }

    // ── Loading / error states ──────────────────────────────────────────────────
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        )
    }

    if (error) {
        return (
            <Box sx={{ p: 4 }}>
                <Typography color="error">Failed to load board: {error}</Typography>
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

                {/* ── Column header row ────────────────────────────────────────────── */}
                {/* Mirrors: MudGrid > MudItem > MudGrid Class="d-flex flex-nowrap" */}
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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

                    {/* ── Kanban grid ─────────────────────────────────────────────────── */}
                    {/*
            DndContext wraps all rows. dnd-kit manages drag state across
            all DroppableCells within it.
            Mirrors: <MudDropContainer> wrapper in Blazor.
          */}
                    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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
                                            const identifier = `${swimlane.order}_${column.order}`
                                            const cellCards = cards.filter(dc => dc.dropArea === identifier)

                                            return (
                                                // Mirrors: MudItem Style="height: 250px" > MudDropZone
                                                <Box key={column.id} sx={{ height: 250, flexShrink: 0 }}>
                                                    <DroppableCell identifier={identifier}>
                                                        {cellCards.map(dc => (
                                                            <DraggableCard
                                                                key={dc.card.id}
                                                                dropCard={dc}
                                                                boardId={boardId!}
                                                                onUpdated={handleCardUpdated}
                                                                onDeleted={handleCardDeleted}
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
                    </DndContext>
                </Box>
            </Paper>
        </Box>
    )
}

export default BoardPage
/**
 * CalendarCardOverlay
 *
 * Opens a card from the calendar in the board's own card editor.
 *
 * Mirrors: the <UpdateCardOverlay> CalendarDate.razor mounted once per day,
 * bound to whichever card was last clicked.
 *
 * ── Why the board is loaded behind it ────────────────────────────────────────
 * UpdateCardOverlay is the board's editor, and it edits through the board's
 * store: it reads the live task list from there, writes each change back with
 * replaceCard, and re-reads the board after anything that renumbers. Handed a
 * card with no board loaded, it would still open — and then every task edit
 * would land in a store that does not hold the card, and the list on screen
 * would stop matching the server after the first reorder.
 *
 * So the card's board is read in the background, silently, the moment the card
 * is opened. Until it arrives the overlay shows the calendar's copy, which is
 * the same card from the same response; once it has, the store's copy takes
 * over and the editor behaves exactly as it does on the board.
 *
 * This is the one place the calendar reaches into the board feature for more
 * than a type, and it is deliberate: there is one card editor, and the calendar
 * should open that rather than grow a second.
 *
 * ── After it closes ──────────────────────────────────────────────────────────
 * The month is re-read, because the edit may have changed what a day shows —
 * a renamed card, a task ticked off.
 */

import React, { useEffect } from 'react'
import { UpdateCardOverlay } from '../Board/Card/UpdateCardOverlay'
import { useBoardStore } from '../Board/Board.Store'
import type { Card } from '../../Entities/Card/Card.Types'

interface CalendarCardOverlayProps {
    card: Card
    onClose: () => void
}

export const CalendarCardOverlay: React.FC<CalendarCardOverlayProps> = ({ card, onClose }) => {
    const loadBoard = useBoardStore(state => state.loadBoard)
    const live = useBoardStore(state => state.cards.find(candidate => candidate.id === card.id))

    useEffect(() => {
        if (card.boardId) loadBoard(card.boardId, { silent: true })
    }, [card.boardId, loadBoard])

    return <UpdateCardOverlay open onClose={onClose} card={live ?? card} boardId={card.boardId} />
}

export default CalendarCardOverlay

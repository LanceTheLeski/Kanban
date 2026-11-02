/**
 * Calendar.StagedCards
 *
 * Cards as an editor holds them, not saved yet — for the date picker and the
 * day preview, which otherwise know only what the server has.
 *
 * The card editor and the day overlay hold their changes until Save (see
 * Task.Staging, useDayDraft). A deadline chosen in one of them is chosen against
 * the day it will land on, so the picker has to see the rest of the editor's
 * changes too: a second task added to a card before Save is put beside the
 * first one's times, not beside a day that does not have them yet. Each editor
 * provides its cards as they will be; usePickerMonth reads them over the ones it
 * fetched, a staged card replacing its stored copy.
 *
 * An editor inside another adds to the cards around it rather than hiding them.
 */

import { createContext } from 'react'
import type { Card } from '../../Entities/Card/Card.Types'

/** The cards as the editors round a picker hold them; none outside an editor. */
export const StagedCardsContext = createContext<Card[]>([])

/**
 * UpdateCardOverlay
 *
 * Mirrors: Card/UpdateCardOverlay.razor + UpdateCardOverlay.cs
 *
 * This is the most complex component in the board feature. In Blazor it contained:
 *   - Editable title + description fields bound to ActiveCard
 *   - A task list built as a RenderFragment factory (_taskListRenderFragment)
 *   - Nested CreateTaskPopover, UpdateTaskPopover per task
 *   - UpdateTimelinePanel
 *   - CommandPanel stub
 *   - Delete card + delete task operations
 *
 * ── RenderFragment elimination ────────────────────────────────────────────────
 * The Blazor _taskListRenderFragment() method was a workaround: Blazor can't
 * conditionally rebuild a list without either a factory method or a full
 * component re-render. React's JSX array map is the native solution — no factory
 * pattern needed.
 *
 * ── Editable state and the card prop ────────────────────────────────────────
 * BoardCardNote mounts this only while it is open, so the useState initialisers below
 * re-run on every open and the draft always starts from the current card. That
 * replaces Blazor's Fire() callback, which re-seeded the fields by hand.
 *
 * Mounting on demand also matters for the board as a whole: this overlay pulls in
 * the timeline pickers, the task popovers and a task-types fetch, and an earlier
 * version kept one instance alive for every card on the board.
 *
 * ── Patch request ────────────────────────────────────────────────────
 * Blazor built a raw JSON Patch string in FormPatchRequestFromOverlay() and sent
 * it to the card *position* endpoint, which ignores Title and Description — card
 * edits never actually persisted. This now patches the card itself through
 * CardController.UpdateCard.
 *
 * ── Width ──────────────────────────────────────────────────────────
 * The Blazor overlay was 1100px wide. We pass this to ArcOverlay via the
 * width prop.
 *
 * ── Everything waits for Save ────────────────────────────────────────────────
 * Its tasks included. A task added, edited, moved or deleted here is staged —
 * held in this overlay, drawn as it will be, marked "new", "edited" or "moved"
 * — and the task popovers say Done rather than writing (Task.Staging). Save
 * writes the card, then its tasks, then reads the board again; Discard drops
 * the lot. It used to be that a task was written the moment its popover was
 * saved, so a card's tasks could change for good in an editor that was then
 * discarded.
 *
 * ── Reading this file ────────────────────────────────────────────────────────
 * UpdateCardOverlay comes first and its return is just the arrangement: two
 * columns on top, panels beneath, the delete action last. Each piece is a small
 * component declared further down — function declarations, so they hoist and can
 * sit below the component that uses them.
 *
 * They stay in this file on purpose. None is reusable anywhere else, and pulling
 * them into separate modules would trade one long file for six short ones plus
 * the imports to find them again.
 */

import React, { useContext, useRef, useState } from 'react'
import {
    Box,
    IconButton,
    List,
    ListItem,
    Paper,
    TextField,
    Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { ArcSplitLayout } from '../../../Components/ArcSplitLayout'
import { UpdateTimelinePanel } from '../Timeline/UpdateTimelinePanel'
import { draftFromTimeline, saveTimeline, TIMELINE_PARENT_CARD, type TimelineDraft } from '../Timeline/Timeline.Draft'
import { inheritedTimeline, overridesTasks, timelineKey } from '../Timeline/Timeline.Inheritance'
import { UpdateTaskPopover } from '../Task/UpdateTaskPopover'
import { CreateTaskPopover } from '../Task/CreateTaskPopover'
import { CommandPanel } from '../Commands/CommandPanel'
import { useBoardActions } from '../Hooks/useBoardActions'
import { deleteCard, updateCard, type CardPatchRequest } from '../Board.APIs'
import {
    applyEdit,
    changeOf,
    isEdited,
    newTaskSaveProgress,
    renumbered,
    saveCardTasks,
    stagedFrom,
    taskKey,
    timelineOfDraft,
    type StagedTask,
    type TaskEdit,
} from '../Task/Task.Staging'
import { StagedCardsContext } from '../../Calendar/Calendar.StagedCards'
import { useBoardStore } from '../Board.Store'
import { TagsPanel } from '../../TagGroup/Tag/TagsPanel'
import { saveTags, sameTags } from '../../TagGroup/Tag/Tag.APIs'
import type { Tag } from '../../../Entities/Tag/Tag.Types'
import {
    CARD_DETAIL_ROW_MIN_HEIGHT,
    CARD_LEFT_PANE_MIN_REM,
    CARD_PANEL_ROW_HEIGHT,
    CARD_PANEL_ROW_MIN_HEIGHT,
    CARD_RIGHT_PANE_MIN_REM,
    CARD_SPLIT_DEFAULT,
    TASK_LIST_MIN_HEIGHT,
    TITLE_ROW_MIN_HEIGHT,
} from '../../../Styles/Measures'
import type { Card } from '../../../Entities/Card/Card.Types'

interface UpdateCardOverlayProps
{
    open: boolean

    onClose: () => void

    card: Card

    boardId: string
}

export const UpdateCardOverlay: React.FC<UpdateCardOverlayProps> = ({
    open,
    onClose,
    card,
    boardId,
}) =>
{
    const { run } = useBoardActions()
    const replaceCard = useBoardStore(state => state.replaceCard)
    const removeCard = useBoardStore(state => state.removeCard)

    // Local editable copies — mirrors Blazor's @bind-Value="ActiveCard.Title" etc.
    const [title, setTitle] = useState(card.title)
    const [description, setDescription] = useState(card.description)

    // The card's own timeline as edited, or null while it is untouched. It used to
    // be shown and never saved: the panel had no onDraftChange, so a day and a time
    // set here were gone when the card closed.
    const [timelineDraft, setTimelineDraft] = useState<TimelineDraft | null>(null)

    // Whether the card keeps dates of its own rather than its tasks' — see
    // Timeline.Inheritance. Saved with the card.
    const [overriding, setOverriding] = useState(() => overridesTasks(card))

    // The card's tags as edited, written with the rest of it on Save (saveTags).
    const [tags, setTags] = useState<Tag[]>(card.tags)

    /**
     * How the overlay's width is divided between the card's detail and its
     * description.
     *
     * Local, and therefore per-opening: drag the bar, close the card, reopen it
     * and it is back at the default. That is deliberate for now — the point is to
     * see whether the control is worth having before adding a column to store it
     * in. It is a single number, so making it stick later means seeding this from
     * the card and patching it on save; nothing else has to change.
     */
    const [split, setSplit] = useState(CARD_SPLIT_DEFAULT)

    /*
       The tasks as they will be after Save — see "Everything waits for Save".

       Seeded once, from the store, when the overlay opens. It used to read the
       store on every render instead, because every task edit was written at
       once and refreshed the board, and a copy could not learn the server's new
       numbers. Nothing is written until Save now, and Save reads the board again
       after, so the copy is the draft and the store is what it is a draft of.
    */
    const storeTasks = useBoardStore(
        state => state.cards.find(candidate => candidate.id === card.id)?.tasks ?? card.tasks,
    )
    const [savedTasks] = useState(() => storeTasks)
    // Numbered by place, which is what a task's order means. A card whose stored
    // orders have gaps or repeats (see saveCardTasks) would otherwise show every
    // task as moved the first time any is.
    const [staged, setStaged] = useState<StagedTask[]>(() => [...storeTasks].sort((a, b) => a.order - b.order)
                                                                            .map((task, index) => stagedFrom({ ...task, order: index })))
    const tasks = staged.map(entry => entry.task)

    // What a Save has written so far, so a second press after a failure does the rest.
    const progress = useRef(newTaskSaveProgress())
    const savedOwn = useRef({ timeline: card.timeline, tags: card.tags })

    // The card's tasks' dates put together, from the tasks as they are now.
    const inherited = inheritedTimeline(tasks)

    // The card as it will be after Save, for the date pickers in it: a task's
    // deadline is chosen beside the other tasks' as staged, not as stored
    // (Calendar.StagedCards).
    const outerStaged = useContext(StagedCardsContext)
    const stagedCards =
    [...outerStaged, {
        ...card,
        title,
        tasks,
        overridesTasks: overriding,
        timeline: timelineDraft
            ? timelineOfDraft(card.timeline, timelineDraft)
            : card.timeline,
    }]

    /**
     * Ticked, the card keeps dates of its own. With none saved yet, it starts
     * from the ones it inherited, as a draft, so they are kept as its own even
     * if nothing is changed. Unticked, any edit to its own dates is dropped; the
     * ones it saved before stay stored, unused, for the next time it is ticked.
     */
    function changeOverriding(next: boolean)
    {
        setOverriding(next)
        setTimelineDraft(next && !card.timeline && inherited
            ? draftFromTimeline(inherited)
            : null)
    }

    const handleSubmit = async () =>
    {
        const patch: CardPatchRequest = {}

        // Only patch fields that changed — mirrors Blazor's FormPatchRequestFromOverlay()
        if (title.trim() && title !== card.title)
            patch.title = title.trim()
        if (description !== card.description)
            patch.description = description

        const tagsChanged = !sameTags(tags, savedOwn.current.tags)
        const tasksChanged = staged.length !== savedTasks.length || staged.some(isEdited)

        if (overriding !== overridesTasks(card))
            patch.overridesTasks = overriding

        // Only a card keeping its own dates writes them; one going by its tasks'
        // shows theirs and has nothing of its own to save.
        const ownTimeline = overriding
            ? timelineDraft
            : null

        if (Object.keys(patch).length === 0 && !ownTimeline && !tagsChanged && !tasksChanged)
        {
            onClose()
            return
        }

        // Each part, once written, is recorded as written (savedOwn, progress), so
        // a Save pressed again after a failure part way does not write it twice.
        const updated = await run(
            'Saving card',
            async () =>
            {
                if (Object.keys(patch).length > 0)
                    await updateCard(boardId, card.id, patch)
                // Created, or patched in place — see saveTimeline.
                if (ownTimeline)
                {
                    savedOwn.current.timeline = await saveTimeline(boardId, { id: card.id, kind: TIMELINE_PARENT_CARD }, savedOwn.current.timeline, ownTimeline)
                    setTimelineDraft(null)
                }
                if (tagsChanged)
                    savedOwn.current.tags = await saveTags({ id: card.id, kind: 'card' }, savedOwn.current.tags, tags)
                if (tasksChanged)
                    await saveCardTasks(boardId, card.id, savedTasks, staged, progress.current)
            },
            // The card alone is patched in local state below. Tasks are renumbered
            // and given IDs by the server, so with any of them changed the board is
            // read again instead.
            { refresh: tasksChanged }
        )
        if (!updated)
            return

        if (!tasksChanged)
            replaceCard({
                ...card,
                title: patch.title ?? card.title,
                description: patch.description ?? card.description,
                tasks: savedTasks,
                timeline: savedOwn.current.timeline,
                overridesTasks: patch.overridesTasks ?? card.overridesTasks,
                tags: savedOwn.current.tags,
            })
        onClose()
    }

    const handleDeleteCard = async () =>
    {
        const deleted = await run(
            `Deleting "${card.title}"`,
            () => deleteCard(boardId, card.id),
            { refresh: false }
        )
        if (!deleted)
            return

        removeCard(card.id)
        onClose()
    }

    // Staged, like every task change here: the task goes on Save — see the header.
    const handleDeleteTask = (taskId: string) =>
        setStaged(current => renumbered(current.filter(entry => entry.task.id !== taskId)))

    // A task edited in its popover, which may have moved it.
    const handleTaskStaged = (edit: TaskEdit) =>
        setStaged(current =>
        {
            const entry = current.find(candidate => candidate.task.id === edit.task.id)
            if (!entry)
                return current
            const rest = current.filter(candidate => candidate !== entry)
            rest.splice(Math.min(edit.task.order, rest.length), 0, applyEdit(entry, edit))
            return renumbered(rest)
        })

    // A new task, at the place chosen for it.
    const handleTaskAdded = (added: StagedTask) =>
        setStaged(current =>
        {
            const next = [...current]
            next.splice(Math.min(added.task.order, next.length), 0, added)
            return renumbered(next)
        })

    return (
        <StagedCardsContext.Provider value={stagedCards}>
        <ArcOverlay open={open}
                    onClose={onClose}
                    onSubmit={handleSubmit}
                    width={OVERLAY_MAX_WIDTH}
                    // Delete used to be a button inside the overlay's content, above the
                    // action group — the one destructive action on the board, in a place
                    // no other overlay put anything. It is now in the bar, at the far
                    // left, and confirms before it runs.
                    onDelete={handleDeleteCard}
                    deleteLabel="Delete Card"
                    deleteConfirm={`Delete "${card.title}" and its tasks?`}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                {/*
                    Top row: card detail on the left, description filling the right.

                    `alignItems: stretch` rather than `start` is what makes the two
                    columns end level. With `start` each column sized to its own
                    content — a fixed 200px task list on the left against a 13-row
                    textarea on the right — so the left column stopped 70px above
                    the right and the dialog read as unbalanced. Both columns now
                    fill the row, and the row has a floor so a sparse card does not
                    produce a different shape of dialog from a full one.
                */}
                <Box sx={{ minHeight: CARD_DETAIL_ROW_MIN_HEIGHT, display: 'flex', flexDirection: 'column' }}>
                    <ArcSplitLayout ratio={split}
                                    onRatioChange={setSplit}
                                    minLeftRem={CARD_LEFT_PANE_MIN_REM}
                                    minRightRem={CARD_RIGHT_PANE_MIN_REM}
                                    // A card that is only a checklist should be able to drop
                                    // the description entirely rather than keep a sliver of it.
                                    collapsibleRight
                                    resetRatio={CARD_SPLIT_DEFAULT}
                                    stackBelow={STACK_BELOW}
                                    label="Resize card detail and description"
                                    left={
                                        <Box sx={{ display: 'flex',
                                                   flexDirection: 'column',
                                                   gap: 1,
                                                   minWidth: 0,
                                                   minHeight: 0,
                                                   flex: 1,
                                                   pr: 1
                                                }}>
                                            <TitleAndTags title={title}
                                                          onTitleChange={setTitle}
                                                          tags={tags}
                                                          onTagsChange={setTags} />
                                            <TaskList staged={staged}
                                                      boardId={boardId}
                                                      cardId={card.id}
                                                      onTaskStaged={handleTaskStaged}
                                                      onTaskAdded={handleTaskAdded}
                                                      onTaskDeleted={handleDeleteTask} />
                                        </Box>
                                    }
                                    right={
                                        <Box sx={{ display: 'flex',
                                                   flexDirection: 'column',
                                                   minWidth: 0,
                                                   minHeight: 0,
                                                   flex: 1,
                                                   pl: 1
                                                }}>
                                            <DescriptionField value={description}
                                                              onChange={setDescription} />
                                        </Box>
                                    } />
                </Box>

                {/*
                    Bottom row: the timeline beside the card's log. Two equal
                    columns that stretch, for the same reason as above — these were
                    a wrapping flex row where each panel sized itself, which left a
                    ragged edge and a hole under the timeline's mode buttons.
                */}
                {/*
                    Side by side, the row is as tall as the timeline needs, and
                    never shorter than CARD_PANEL_ROW_HEIGHT. It was exactly that
                    height, so opening a point — its day, time and Day pieces —
                    pushed the timeline's content out under its own inheritance
                    segment. The log is held out of the sizing (contain: size), so
                    its entries scroll inside the row rather than growing it.
                    Stacked, each takes the full width and what it needs.
                */}
                <Box sx={{ display: 'grid',
                           gridTemplateColumns: { xs: '1fr', [STACK_BELOW]: 'minmax(0, 1fr) minmax(0, 1fr)' },
                           gridTemplateRows: { [STACK_BELOW]: `minmax(${CARD_PANEL_ROW_HEIGHT}, auto)` },
                           gap: 2,
                           alignItems: 'stretch',
                           minHeight: CARD_PANEL_ROW_MIN_HEIGHT
                        }}>
                    {/*
                        Keyed on whose dates it shows, so ticking the box starts
                        the panel again from the other set rather than editing
                        the one on screen — and, while it shows its tasks', on
                        what those are, so a task saved with new dates shows
                        here straight away.
                    */}
                    <UpdateTimelinePanel key={overriding
                                             ? 'own'
                                             : `inherited:${timelineKey(inherited)}`}
                                         timeline={overriding
                                             ? card.timeline ?? inherited
                                             : inherited}
                                         readOnly={!overriding}
                                         onDraftChange={setTimelineDraft}
                                         boardId={boardId}
                                         subject={{ kind: 'card', id: card.id }}
                                         subjectTitle={title}
                                         inheritance={{ overriding,
                                                        tasksWithDates: tasks.filter(task => inheritedTimeline([task]) !== null).length,
                                                        tasks: tasks.length,
                                                        onOverridingChange: changeOverriding
                                                     }} />
                    <Box sx={{ minWidth: 0,
                               display: 'flex',
                               contain: { [STACK_BELOW]: 'size' }
                            }}>
                        <CommandPanel card={card} />
                    </Box>
                </Box>

            </Box>
        </ArcOverlay>
        </StagedCardsContext.Provider>
    )
}

export default UpdateCardOverlay

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

// The Blazor original was 1100px wide with a 400px and a 700px column. Only the
// overall width is still a pixel value — and it is a *maximum*, not a size.
//
// The 4:7 those numbers described is now only where the split *starts*
// (CARD_SPLIT_DEFAULT): the reader drags the bar between the two panes from
// there. See ArcSplitLayout.
const OVERLAY_MAX_WIDTH = 1100

// Below this the two columns stop being readable side by side and stack.
const STACK_BELOW = 'md'

// ── Pieces of the overlay ─────────────────────────────────────────────────────
// Everything below is presentation for the arrangement above. Declared as
// functions so they hoist, which lets the component that composes them be read
// first.

/**
 * Card title beside its tags.
 *
 * Mirrors Blazor's MudGrid Spacing="0" row at the top of the overlay, which put
 * a fixed 120x60 "Tags…" placeholder to the right of the title. That position
 * was right; only what sat in it was a placeholder. The tags are real now and
 * still live there, small.
 */
function TitleAndTags({ title, onTitleChange, tags, onTagsChange }: {
    title: string
    onTitleChange: (title: string) => void
    tags: Tag[]
    onTagsChange: (tags: Tag[]) => void
})
{
    return (
        <Box sx={{ display: 'flex',
                   gap: 1,
                   flexShrink: 0,
                   minHeight: TITLE_ROW_MIN_HEIGHT,
                   // The title grows with its content now, so the tags box tracks
                   // its height rather than the two disagreeing.
                   alignItems: 'stretch'
                }}>
            <TextField value={title}
                       onChange={e => onTitleChange(e.target.value)}
                       variant="outlined"
                       /*
                          No helperText. "Card Title" under a box holding the card's
                          title told the reader nothing they could not see, and MUI
                          reserves the line whether or not there is anything in it — so
                          it cost a row of height on both of the overlay's text boxes.
                          The placeholder says the same thing, in the space the value
                          will occupy, and only while the field is empty.
                       */
                       placeholder="Card title"
                       size="small"
                       /*
                          Multiline, up to three lines.

                          A single-line input shows a long title as whatever fits and
                          scrolls the rest out of sight — so the field could hold a title
                          the reader could not read back without dragging through it. A
                          card title is a sentence often enough that this was the common
                          case, not the edge one.

                          Three lines rather than unbounded: past that the title is
                          taking room from the task list underneath, and what is wanted
                          is a description.
                       */
                       multiline
                       maxRows={3}
                       /*
                          The field is a piece of card you write on, so the card's
                          own cut edge is its border and the outlined variant's
                          notch is turned off below. Two borders a pixel apart
                          read as a rendering fault, not as emphasis.
                       */
                       className="card-stock"
                       sx={{ // minWidth: 0 stops the input's intrinsic width propping the row open.
                             flex: 1,
                             minWidth: 0,
                             '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                             '& .MuiInputBase-input': { color: 'arc.onPaperStrong', fontWeight: 600 },
                             '& .MuiInputBase-input::placeholder': { color: 'arc.onPaperMuted', opacity: 1 },
                             /*
                                The input fills the field rather than sitting at the top of
                                it. MUI sizes a FormControl to input + helper text, so with
                                the helper text gone the box kept the row's height and left
                                the freed space empty underneath — the opposite of the point,
                                which was to give the title that room. Text starts at the top
                                so a one-line title does not float in the middle of a box
                                sized for three.
                             */
                             '& .MuiInputBase-root': { height: '100%', alignItems: 'flex-start' }
                          }} />

            <TagsPanel tags={tags}
                       onChange={onTagsChange}
                       label="Card tags" />
        </Box>
    )
}

/**
 * The card's tasks as staged, each a popover row with a delete button, and a
 * create row at the end. Replaces Blazor's _taskListRenderFragment() factory — a
 * workaround for Blazor not being able to rebuild a list without one.
 *
 * A row staged and not saved says so at its end — "new", "edited" or "moved"
 * (changeOf) — so what Save will write can be seen before it is.
 */
function TaskList({ staged, boardId, cardId, onTaskStaged, onTaskAdded, onTaskDeleted }: {
    staged: StagedTask[]
    boardId: string
    cardId: string
    onTaskStaged: (edit: TaskEdit) => void
    onTaskAdded: (added: StagedTask) => void
    onTaskDeleted: (taskId: string) => void
})
{
    return (
        /*
           The one panel in the overlay that keeps its engraved recess.

           Everything else in here is now a piece of card sitting on the pane
           (see .card-stock). This is the exception on purpose: it is a
           *container* for other pieces rather than a piece itself, and a tray
           reads as a tray because the things in it are above its floor. Make it
           card too and the rows have nothing to sit on.
        */
        <Paper className="glass-inner-engraved"
               /*
                  Takes the height the column has left rather than claiming a fixed
                  200px. That fixed height was what made the left column end short of
                  the description beside it. minHeight keeps it a usable target when
                  the row is at its floor; it scrolls past that.
               */
               sx={{ width: '100%',
                     flex: 1,
                     minHeight: TASK_LIST_MIN_HEIGHT,
                     overflow: 'auto',
                     p: 0.75
                  }}>
            {/*
                A gap between the rows, because a drop shadow needs somewhere to
                fall. Butted up against each other they were four rectangles with
                a line between them; 6px apart they are four pieces of card.
            */}
            <List dense
                  disablePadding
                  sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                { staged.length === 0 && (
                    <ListItem disablePadding
                              sx={{ px: 1, py: 1.5 }}>
                        <Typography sx={{ fontSize: '0.72rem', color: 'arc.onGlassMuted' }}>
                            No tasks on this card yet.
                        </Typography>
                    </ListItem>
                )
                }

                {/*
                    One piece of card per task, laid on the tray, in the same
                    green the timeline's own tab is cut from — a task is the
                    scheduled unit of work, and the two places that say so now
                    say it in the same colour.

                    card-stock-flat rather than card-stock: a row is one ply up
                    from the floor it sits on, not four, and giving it the
                    panel's shadow is what makes layered paper look like clip
                    art.
                */}
                { staged.map(({ task, ...entry }) =>
                             (
                                 <ListItem key={task.id}
                                           className="card-stock-flat card-tilt paper-green"
                                           disablePadding
                                           sx={{ pr: 0.25 }}>
                                     {/* The popover trigger takes the row; the bin sits at the end */}
                                     <Box sx={{ flex: 1, minWidth: 0 }}>
                                         {/*
                                             Keyed on the values the popover seeds its draft
                                             from. A reorder renumbers every task on the card,
                                             and each popover captured its order once when it
                                             mounted — so after a move, the rows that did not
                                             move still offered the positions they used to
                                             have. Changing the key remounts them, which is
                                             what re-runs those initialisers.
                                         */}
                                         <UpdateTaskPopover key={taskKey(task)}
                                                            task={task}
                                                            onStage={onTaskStaged}
                                                            boardId={boardId}
                                                            cardId={cardId}
                                                            tasksCount={staged.length}
                                                            triggerSize="small"
                                                            triggerSx={{
                                                                width: '100%',
                                                                justifyContent: 'flex-start',
                                                                backgroundColor: 'transparent',
                                                                color: 'arc.onPaper',
                                                                // The strike for a completed task is applied by
                                                                // the popover, which is the only thing that
                                                                // knows whether the box has been ticked but not
                                                                // yet saved.
                                                                      }} />
                                     </Box>

                                     { changeOf({ task, ...entry }) && (
                                         <Typography component="span"
                                                     sx={{ flexShrink: 0,
                                                           fontSize: '0.6rem',
                                                           fontStyle: 'italic',
                                                           color: 'arc.onPaperMuted'
                                                        }}>
                                             { changeOf({ task, ...entry }) }
                                         </Typography>
                                     )
                                     }

                                     {/* Mirrors Blazor's trash icon @onclick */}
                                     {/*
                                         Quiet until reached for. In MUI's default colour these
                                         bins were the darkest thing in the list — four of them
                                         pulling more attention than the task titles they
                                         belong to, for an action nobody comes here to take.
                                     */}
                                     <IconButton size="small"
                                                 onClick={() => onTaskDeleted(task.id)}
                                                 aria-label={`Delete task ${task.title}`}
                                                 sx={{ flexShrink: 0,
                                                       color: 'arc.onPaperMuted',
                                                       '&:hover': { color: 'arc.paperDanger', backgroundColor: 'arc.paperHover' }
                                                    }}>
                                         <DeleteIcon sx={{ fontSize: '0.95rem' }} />
                                     </IconButton>
                                 </ListItem>
                             ))
                }

                {/*
                    No left padding. It had an indent the task rows above it did
                    not, so the one row that is an action was the one row that did
                    not line up with the others.
                */}
                <ListItem disablePadding>
                    <CreateTaskPopover boardId={boardId}
                                       cardId={cardId}
                                       tasksCount={staged.length}
                                       onStage={onTaskAdded} />
                </ListItem>
            </List>
        </Paper>
    )
}

/**
 * The card description, filling the right-hand column.
 *
 * `rows={13}` is gone. A fixed row count made the description the thing that
 * decided how tall the whole top row was, and 13 rows is not a number anyone
 * chose — it was whatever happened to look right next to a 200px task list.
 *
 * Making a multiline TextField fill its container takes three rules, because
 * MUI sizes the textarea from its content by default:
 *   - the FormControl becomes a flex column, so the helper text sits under a
 *     growing input rather than being pushed out of the box
 *   - the InputBase takes the remaining height
 *   - the textarea fills the InputBase and scrolls its own overflow
 *
 * `:not([aria-hidden])` matters: an autosizing MUI textarea has a second,
 * hidden textarea used to measure content, and forcing that one to 100% height
 * makes it report a height that grows every render.
 */
function DescriptionField({ value, onChange }: {
    value: string
    onChange: (description: string) => void
})
{
    return (
        <TextField value={value}
                   onChange={e => onChange(e.target.value)}
                   multiline
                   variant="outlined"
                   placeholder="Card description"
                   fullWidth
                   className="card-stock"
                   sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                         '& .MuiInputBase-input': { color: 'arc.onPaper' },
                         '& .MuiInputBase-input::placeholder': { color: 'arc.onPaperMuted', opacity: 1 },
                         display: 'flex',
                         flexDirection: 'column',
                         flex: 1,
                         minHeight: 0,
                         '& .MuiInputBase-root': {
                             flex: 1,
                             minHeight: 0,
                             alignItems: 'flex-start',
                         },
                         '& textarea:not([aria-hidden])': {
                             height: '100% !important',
                             overflow: 'auto !important',
                             // Smaller than the field default: this is a body of text, not
                             // a single value, and at the input's default size a full
                             // description filled the pane in a handful of lines.
                             fontSize: '0.82rem',
                             lineHeight: 1.5,
                         }
                      }} />
    )
}

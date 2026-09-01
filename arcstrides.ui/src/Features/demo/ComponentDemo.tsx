/**
 * ComponentDemo
 *
 * A small sandbox page that exercises all four Arc* components together.
 * This is intentionally NOT wired to any API — it demonstrates the component
 * contracts using local state only.
 */

import React from 'react'
import {
    Box,
    Button,
    Chip,
    Divider,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import BugReportIcon from '@mui/icons-material/BugReport'

import { ArcOverlay } from '../../Components/ArcOverlay'
import { ArcPopover } from '../../Components/ArcPopover'
import { ArcExpandingSelector } from '../../Components/ArcExpandingSelector'
import { useArcError } from '../../Components/useArcError'

// ── Sample data ───────────────────────────────────────────────────────────────

const COLUMNS = ['Backlog', 'In Progress', 'Review', 'Done']
const SWIMLANES = ['Frontend', 'Backend', 'Infrastructure', 'Design']
const TASK_TYPES = ['Bug', 'Feature', 'Chore', 'Research', 'Spike']

// ── Sub-components ────────────────────────────────────────────────────────────

/** A labelled demo section card */
const DemoSection: React.FC<{
    label: string
    description: string
    children: React.ReactNode
}> = ({ label, description, children }) => (
    <Paper
        className="glass-frosted"
        sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}
    >
        <Box>
            <Typography
                sx={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: '0.7rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.5)',
                    mb: 0.5,
                }}
            >
                {label}
            </Typography>
            <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}
            >
                {description}
            </Typography>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />
        <Box>{children}</Box>
    </Paper>
)

// ── Main Demo ─────────────────────────────────────────────────────────────────

export const ComponentDemo: React.FC = () => {
    const { addError, addSuccess, addInfo } = useArcError()

    // ── ArcOverlay state ───────────────────────────────────────────────────────
    const [createCardOpen, setCreateCardOpen] = React.useState(false)
    const [cardTitle, setCardTitle] = React.useState('')
    const [cardDescription, setCardDescription] = React.useState('')
    const [cardColumn, setCardColumn] = React.useState<string | null>(null)
    const [cardSwimlane, setCardSwimlane] = React.useState<string | null>(null)
    const [lastCreated, setLastCreated] = React.useState<string | null>(null)

    const handleCreateCard = async () => {
        // Mirrors the validation logic in CreateCardOverlay.cs
        if (!cardTitle.trim()) {
            addError('Card title is required', 422)
            return
        }
        if (!cardColumn) {
            addError('Please select a column', 422)
            return
        }
        if (!cardSwimlane) {
            addError('Please select a swimlane', 422)
            return
        }

        // Simulate async API call (CreateCardPositionAsync)
        await new Promise((r) => setTimeout(r, 800))

        const summary = `"${cardTitle}" → ${cardColumn} / ${cardSwimlane}`
        setLastCreated(summary)
        addSuccess(`Card created: ${summary}`)

        // Reset and close — mirrors CloseOverlay() in CreateCardOverlay.cs
        setCardTitle('')
        setCardDescription('')
        setCardColumn(null)
        setCardSwimlane(null)
        setCreateCardOpen(false)
    }

    // ── ArcPopover state ───────────────────────────────────────────────────────
    const [taskTitle, setTaskTitle] = React.useState('Implement drag-and-drop')
    const [taskType, setTaskType] = React.useState<string | null>(null)

    const handleUpdateTask = async () => {
        await new Promise((r) => setTimeout(r, 600))
        addSuccess(`Task updated: "${taskTitle}"`)
    }

    // ── ArcExpandingSelector standalone demo ──────────────────────────────────
    const [selectedTaskType, setSelectedTaskType] = React.useState<string | null>(null)

    // ── ArcErrorDisplay demo ───────────────────────────────────────────────────
    const errorScenarios = [
        { label: 'Error (with code)', fn: () => addError('Resource not found', 404) },
        { label: 'Error (no code)', fn: () => addError('An unexpected error occurred') },
        { label: 'Success', fn: () => addSuccess('Card position updated') },
        { label: 'Info', fn: () => addInfo('Refreshing board data…') },
    ]

    return (
        <Box className="demo-root">
            {/* ── Header ── */}
            <Box>
                <Typography
                    variant="h2"
                    sx={{
                        fontFamily: '"EB Garamond", serif',
                        fontWeight: 600,
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                        color: '#fff',
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                    }}
                >
                    ArcStrides
                </Typography>
                <Typography
                    sx={{
                        fontFamily: '"DM Mono", monospace',
                        fontSize: '0.8rem',
                        color: 'rgba(255,255,255,0.5)',
                        mt: 0.5,
                        letterSpacing: '0.08em',
                    }}
                >
                    Component Demo — Arc* primitives in React + MUI
                </Typography>
            </Box>

            {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1: ArcOverlay
          Mirrors: CreateCardOverlay.razor + CreateCardOverlay.cs
      ══════════════════════════════════════════════════════════════════════ */}
            <DemoSection
                label="ArcOverlay"
                description='Replaces ArcOverlay.razor — full-screen modal with glass Paper, ChildContent slot, Submit/Discard buttons. Mirrors @bind-Open + OnSubmitAsync pattern.'
            >
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateCardOpen(true)}
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                    >
                        Add Card
                    </Button>

                    {lastCreated && (
                        <Chip
                            label={`Last created: ${lastCreated}`}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(185,224,166,0.3)',
                                color: 'white',
                                fontFamily: '"DM Mono", monospace',
                                fontSize: '0.7rem',
                            }}
                        />
                    )}
                </Stack>

                {/* The overlay itself */}
                <ArcOverlay
                    open={createCardOpen}
                    onClose={() => setCreateCardOpen(false)}
                    onSubmit={handleCreateCard}
                    width={520}
                >
                    <Stack spacing={2}>
                        <Typography
                            variant="h6"
                            sx={{ color: 'rgba(255,255,255,0.9)', fontFamily: '"EB Garamond", serif' }}
                        >
                            Add a New Card
                        </Typography>

                        {/* MudTextField @bind-Value="_cardTitle" → controlled TextField */}
                        <TextField
                            value={cardTitle}
                            onChange={(e) => setCardTitle(e.target.value)}
                            label="Title"
                            variant="filled"
                            helperText="Card Title"
                            fullWidth
                            size="small"
                            InputProps={{ sx: { bgcolor: 'rgba(255,255,255,0.12)', color: 'white' } }}
                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)' } }}
                        />

                        <TextField
                            value={cardDescription}
                            onChange={(e) => setCardDescription(e.target.value)}
                            label="Description"
                            variant="filled"
                            helperText="Card Description"
                            multiline
                            minRows={3}
                            fullWidth
                            size="small"
                            InputProps={{ sx: { bgcolor: 'rgba(255,255,255,0.12)', color: 'white' } }}
                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)' } }}
                        />

                        {/* ArcExpandingSelector for Column */}
                        <Box>
                            <Typography
                                variant="caption"
                                sx={{ color: 'rgba(255,255,255,0.5)', fontFamily: '"DM Mono", monospace', mb: 0.5, display: 'block' }}
                            >
                                Column
                            </Typography>
                            <ArcExpandingSelector
                                options={COLUMNS}
                                onSelect={setCardColumn}
                                placeholder="-- Select Column --"
                            />
                        </Box>

                        {/* ArcExpandingSelector for Swimlane */}
                        <Box>
                            <Typography
                                variant="caption"
                                sx={{ color: 'rgba(255,255,255,0.5)', fontFamily: '"DM Mono", monospace', mb: 0.5, display: 'block' }}
                            >
                                Swimlane
                            </Typography>
                            <ArcExpandingSelector
                                options={SWIMLANES}
                                onSelect={setCardSwimlane}
                                placeholder="-- Select Swimlane --"
                            />
                        </Box>
                    </Stack>
                </ArcOverlay>
            </DemoSection>

            {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2: ArcPopover
          Mirrors: UpdateTaskPopover.razor — inline popover edit for a task
      ══════════════════════════════════════════════════════════════════════ */}
            <DemoSection
                label="ArcPopover"
                description='Replaces ArcPopover.razor — inline popover anchored to a trigger button. Used in UpdateTaskPopover for editing tasks without leaving the board view.'
            >
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <Typography
                        variant="body2"
                        sx={{ color: 'rgba(255,255,255,0.6)', fontFamily: '"DM Mono", monospace', fontSize: '0.75rem' }}
                    >
                        Click a task to edit inline:
                    </Typography>

                    {/* This matches the usage in CalendarDate.razor and UpdateCardOverlay.razor */}
                    <ArcPopover
                        triggerLabel={taskTitle}
                        triggerSize="small"
                        onSubmit={handleUpdateTask}
                        triggerStyle={{
                            backgroundColor: 'rgba(255, 236, 165, 0.4)',
                            padding: '2px 8px',
                            maxHeight: 28,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            textAlign: 'left',
                        }}
                        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    >
                        <Stack spacing={2} sx={{ minWidth: 320 }}>
                            <Typography
                                sx={{ color: 'rgba(255,255,255,0.9)', fontFamily: '"EB Garamond", serif', fontSize: '1.1rem' }}
                            >
                                Edit Task
                            </Typography>

                            <TextField
                                value={taskTitle}
                                onChange={(e) => setTaskTitle(e.target.value)}
                                label="Title"
                                variant="filled"
                                size="small"
                                fullWidth
                                InputProps={{ sx: { bgcolor: 'rgba(255,255,255,0.12)', color: 'white' } }}
                                InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)' } }}
                            />

                            <Box>
                                <Typography
                                    variant="caption"
                                    sx={{ color: 'rgba(255,255,255,0.5)', fontFamily: '"DM Mono", monospace', mb: 0.5, display: 'block' }}
                                >
                                    Task Type
                                </Typography>
                                <ArcExpandingSelector
                                    options={TASK_TYPES}
                                    onSelect={setTaskType}
                                    placeholder="-- Select Type --"
                                />
                            </Box>

                            {taskType && (
                                <Chip
                                    label={taskType}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', alignSelf: 'flex-start', fontFamily: '"DM Mono", monospace' }}
                                />
                            )}
                        </Stack>
                    </ArcPopover>

                    <Typography
                        variant="caption"
                        sx={{ color: 'rgba(255,255,255,0.4)', fontFamily: '"DM Mono", monospace', fontSize: '0.7rem' }}
                    >
                        ← click that yellow button
                    </Typography>
                </Stack>
            </DemoSection>

            {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3: ArcExpandingSelector — standalone
          Mirrors: ArcExpandingSelector.razor
      ══════════════════════════════════════════════════════════════════════ */}
            <DemoSection
                label="ArcExpandingSelector"
                description='Replaces ArcExpandingSelector.razor — accordion-style selector. Used anywhere a list of options needs to expand inline without taking up permanent space.'
            >
                <Stack direction="row" spacing={3} flexWrap="wrap" alignItems="flex-start">
                    <Box sx={{ minWidth: 220 }}>
                        <Typography
                            variant="caption"
                            sx={{ color: 'rgba(255,255,255,0.5)', fontFamily: '"DM Mono", monospace', mb: 1, display: 'block' }}
                        >
                            Swimlane selector
                        </Typography>
                        <ArcExpandingSelector
                            options={SWIMLANES}
                            onSelect={(v) => addInfo(`Swimlane selected: ${v}`)}
                            placeholder="-- Select Swimlane --"
                        />
                    </Box>

                    <Box sx={{ minWidth: 220 }}>
                        <Typography
                            variant="caption"
                            sx={{ color: 'rgba(255,255,255,0.5)', fontFamily: '"DM Mono", monospace', mb: 1, display: 'block' }}
                        >
                            Column order (numeric list)
                        </Typography>
                        <ArcExpandingSelector
                            options={['0', '1', '2', '3']}
                            onSelect={(v) => {
                                setSelectedTaskType(v)
                                addInfo(`Order selected: ${v}`)
                            }}
                            placeholder="-- Select Order --"
                        />
                    </Box>

                    {selectedTaskType && (
                        <Chip
                            label={`Order: ${selectedTaskType}`}
                            sx={{ bgcolor: 'rgba(36,148,231,0.4)', color: 'white', fontFamily: '"DM Mono", monospace', alignSelf: 'center' }}
                        />
                    )}
                </Stack>
            </DemoSection>

            {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4: ArcErrorDisplay / useArcError
          Mirrors: ArcErrorHandler.cs + IArcErrorHandler.cs + MyMudProviders.razor
      ══════════════════════════════════════════════════════════════════════ */}
            <DemoSection
                label="ArcErrorDisplay  ·  useArcError"
                description='Replaces ArcErrorHandler.cs + IArcErrorHandler.cs — imperative snackbar notifications via useArcError() hook. The provider is configured at app root (see App.tsx).'
            >
                <Stack direction="row" spacing={2} flexWrap="wrap">
                    {errorScenarios.map(({ label, fn }) => (
                        <Button
                            key={label}
                            startIcon={<BugReportIcon />}
                            onClick={fn}
                            variant="outlined"
                            size="small"
                            sx={{
                                borderColor: 'rgba(255,255,255,0.3)',
                                color: 'rgba(255,255,255,0.8)',
                                fontFamily: '"DM Mono", monospace',
                                fontSize: '0.75rem',
                                '&:hover': { borderColor: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.08)' },
                            }}
                        >
                            {label}
                        </Button>
                    ))}
                </Stack>

                <Typography
                    variant="caption"
                    sx={{ color: 'rgba(255,255,255,0.35)', fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', mt: 1, display: 'block' }}
                >
                    Max 5 shown · no duplicates · top-center — matches MyMudProviders.razor configuration
                </Typography>
            </DemoSection>

            {/* ── Footer ── */}
            <Box sx={{ pb: 4 }}>
                <Typography
                    sx={{
                        fontFamily: '"DM Mono", monospace',
                        fontSize: '0.7rem',
                        color: 'rgba(255,255,255,0.25)',
                        textAlign: 'center',
                    }}
                >
                    arc-strides-react · component demo · not committed to git
                </Typography>
            </Box>
        </Box>
    )
}

export default ComponentDemo
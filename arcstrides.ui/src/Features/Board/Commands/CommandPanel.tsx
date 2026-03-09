/**
 * CommandPanel
 *
 * Mirrors: Commands/CommandPanel.razor
 *
 * The Blazor version was a structural stub — a message list and a text input
 * with an icon, but no logic. Preserved here as a faithful layout stub.
 * This is the AI command / chat input area referenced inside UpdateCardOverlay.
 */

import React from 'react'
import { Box, IconButton, Paper, Stack, TextField, Typography } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'

export const CommandPanel: React.FC = () => {
    return (
        <Paper
            className="glass-inner-engraved"
            sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 240 }}
        >
            {/* Message list — stub */}
            <Stack spacing={0.5} sx={{ minHeight: 80 }}>
                <Typography variant="body2" sx={{ opacity: 0.5 }}>Text 1</Typography>
                <Typography variant="body2" sx={{ opacity: 0.5 }}>Text 2</Typography>
                <Typography variant="body2" sx={{ opacity: 0.5 }}>Text 3</Typography>
            </Stack>

            {/* Input row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton size="small" disabled>
                    {/* (Icon) placeholder */}
                    <SendIcon fontSize="small" />
                </IconButton>
                <TextField
                    size="small"
                    variant="outlined"
                    placeholder="Command…"
                    fullWidth
                    disabled
                />
            </Box>
        </Paper>
    )
}

export default CommandPanel
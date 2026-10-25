import { Box, Button, Divider, Drawer, IconButton, Stack, TextField, Typography } from "@mui/material";
import { CloseRounded } from "@mui/icons-material";
import { useState } from "react";

export default function TeamFormDrawer({ open, team, busy, error, onClose, onSave }) {
  const [name, setName] = useState(team?.name ?? "");
  const validName = name.trim().length > 0 && name.trim().length <= 100;
  return (
    <Drawer anchor="right" open={open} onClose={busy ? undefined : onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 470 }, maxWidth: "100vw" } }}>
      <Box component="form" onSubmit={(event) => { event.preventDefault(); if (validName) onSave(name.trim()); }} sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", p: { xs: 2, sm: 3 } }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>{team ? "Rename team" : "Create team"}</Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>Teams belong to one workspace.</Typography>
          </Box>
          <IconButton onClick={onClose} disabled={busy} aria-label="Close"><CloseRounded /></IconButton>
        </Stack>
        <Divider />
        <Box sx={{ flex: 1, px: { xs: 2, sm: 3 }, pt: 3 }}>
          <TextField autoFocus fullWidth required label="Team name" value={name} onChange={(event) => setName(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 100 } }} error={Boolean(error)} helperText={error || "Maximum 100 characters; names are case-sensitive."} />
        </Box>
        <Divider />
        <Stack direction="row" sx={{ justifyContent: "flex-end", gap: 1, p: 2 }}>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={!validName || busy}>{busy ? "Saving..." : team ? "Save changes" : "Create team"}</Button>
        </Stack>
      </Box>
    </Drawer>
  );
}

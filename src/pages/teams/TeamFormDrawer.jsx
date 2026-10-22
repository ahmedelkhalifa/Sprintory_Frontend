import { useState } from "react";
import { Box, Button, Checkbox, Divider, Drawer, IconButton, InputAdornment, Paper, Stack, TextField, Typography } from "@mui/material";
import { AddRounded, CloseRounded, FolderOutlined, SearchRounded } from "@mui/icons-material";
import { demoMembers, demoProjects } from "./teamsDemoData";
import { PersonAvatar } from "./TeamVisuals";

export default function TeamFormDrawer({ open, team, draft, setDraft, duplicateName, onClose, onSave }) {
  const [personSearch, setPersonSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const editing = Boolean(team);
  const filteredMembers = demoMembers.filter((member) => `${member.name} ${member.email}`.toLowerCase().includes(personSearch.toLowerCase()));
  const filteredProjects = demoProjects.filter((project) => project.name.toLowerCase().includes(projectSearch.toLowerCase()));

  const toggle = (field, id) => setDraft((current) => ({
    ...current,
    [field]: current[field].includes(id)
      ? current[field].filter((value) => value !== id)
      : [...current[field], id],
  }));

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      PaperProps={{ sx: { width: { xs: "100%", sm: 475 }, maxWidth: "100vw", bgcolor: "background.paper" } }}
    >
      <Box component="form" onSubmit={(event) => { event.preventDefault(); onSave(); }} sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
        <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between",  px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>{editing ? "Edit team" : "Create team"}</Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>Organize people and projects in your workspace.</Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close team form"><CloseRounded /></IconButton>
        </Stack>
        <Divider />
        <Box sx={{ flex: 1, overflowY: "auto", px: { xs: 2, sm: 3 }, py: 2.5 }}>
          <Stack spacing={2.25}>
            <TextField
              required
              fullWidth
              label="Team name"
              error={duplicateName}
              helperText={duplicateName ? "A team with this name already exists." : " "}
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              inputProps={{ maxLength: 80 }}
              placeholder="e.g. Product Development"
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              placeholder="What does this team work on?"
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              inputProps={{ maxLength: 400 }}
            />
            <Box>
              <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between",  mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={750}>Members</Typography>
                <Typography variant="caption" color="text.secondary">{draft.members.length} selected</Typography>
              </Stack>
              <TextField
                fullWidth size="small" placeholder="Search workspace members"
                value={personSearch}
                onChange={(event) => setPersonSearch(event.target.value)}
                inputProps={{ "aria-label": "Search workspace members" }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> }}
              />
              <Paper variant="outlined" sx={{ mt: 1, maxHeight: 210, overflowY: "auto", borderRadius: 1.5 }}>
                {filteredMembers.map((member) => (
                  <Box component="label" key={member.id} sx={{ px: 1.4, py: 0.7, display: "flex", alignItems: "center", cursor: "pointer", gap: 1, "&:hover": { bgcolor: "action.hover" } }}>
                    <PersonAvatar member={member} size={30} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600}>{member.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflowWrap: "anywhere" }}>{member.email}</Typography>
                    </Box>
                    <Checkbox checked={draft.members.includes(member.id)} onChange={() => toggle("members", member.id)} inputProps={{ "aria-label": `Add ${member.name}` }} size="small" />
                  </Box>
                ))}
                {filteredMembers.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>No matching members.</Typography>}
              </Paper>
            </Box>
            <Box>
              <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between",  mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={750}>Projects</Typography>
                <Typography variant="caption" color="text.secondary">{draft.projects.length} selected</Typography>
              </Stack>
              <TextField
                fullWidth size="small" placeholder="Search workspace projects"
                value={projectSearch}
                onChange={(event) => setProjectSearch(event.target.value)}
                inputProps={{ "aria-label": "Search workspace projects" }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> }}
              />
              <Paper variant="outlined" sx={{ mt: 1, maxHeight: 200, overflowY: "auto", borderRadius: 1.5 }}>
                {filteredProjects.map((project) => (
                  <Box component="label" key={project.id} sx={{ px: 1.4, py: 0.85, display: "flex", alignItems: "center", cursor: "pointer", gap: 1, "&:hover": { bgcolor: "action.hover" } }}>
                    <FolderOutlined sx={{ color: "primary.main", fontSize: 22 }} />
                    <Typography variant="body2" sx={{ flex: 1 }}>{project.name}</Typography>
                    <Checkbox checked={draft.projects.includes(project.id)} onChange={() => toggle("projects", project.id)} inputProps={{ "aria-label": `Assign ${project.name}` }} size="small" />
                  </Box>
                ))}
                {filteredProjects.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>No matching projects.</Typography>}
              </Paper>
            </Box>
          </Stack>
        </Box>
        <Divider />
        <Stack direction="row" sx={{ justifyContent: "flex-end", gap: 1, p: { xs: 1.5, sm: 2.5 } }}>
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={!draft.name.trim() || duplicateName} startIcon={<AddRounded />}>{editing ? "Save changes" : "Create team"}</Button>
        </Stack>
      </Box>
    </Drawer>
  );
}


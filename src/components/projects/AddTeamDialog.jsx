import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Radio,
  Stack,
  Typography,
} from "@mui/material";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import SearchField from "../general/SearchField";
import LoadState from "../general/LoadState";
import Pager from "../general/Pager";
import { addTeamToProject } from "../../api/projectsApi";
import { listWorkspaceTeams } from "../../api/teamsApi";
import { usePagedList } from "../../hooks/usePagedList";
import { useSubmit } from "../../hooks/useSubmit";
import { PROJECT_ERROR_MESSAGES } from "../../constants/projects";

const ERRORS = {
  ...PROJECT_ERROR_MESSAGES,
  // projects-docs.md §3.6: the team was deleted, or belongs to another workspace
  BAD_REQUEST: "This team no longer exists. Pick another one.",
};

// "Add team" window: pick one team of the workspace; everyone in it right now joins the project.
const AddTeamDialog = ({ project, onClose, onAdded }) => {
  const teams = usePagedList((params) => listWorkspaceTeams(project.workspaceId, params), [project.workspaceId], {
    size: 8,
    messages: { fallback: "Couldn't load the teams. Please try again." },
  });
  const [picked, setPicked] = useState(null);
  const submit = useSubmit(ERRORS);

  const handleAdd = async () => {
    const { ok } = await submit.run(() => addTeamToProject(project.id, picked.id));
    if (ok) onAdded();
  };

  const query = teams.search.trim();

  return (
    <Dialog open onClose={submit.submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>Add a team to {project.name}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 1 }}>
          {/* projects-docs.md §5.4: tell the admin it's a one-time copy */}
          <Alert severity="info">
            Everyone in the team right now joins the project. People who join the team later aren't added; add the
            team again to bring them in.
          </Alert>

          <SearchField value={teams.search} onChange={teams.setSearch} placeholder="Search teams" sx={{ width: "100%" }} />

          <Box sx={{ minHeight: 280, border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
            <LoadState
              loading={teams.loading}
              error={teams.error}
              onRetry={teams.reload}
              isEmpty={teams.items.length === 0}
              emptyMessage={query ? `No teams match "${query}".` : "This workspace has no teams yet."}
              rows={4}
            >
              <List dense disablePadding role="radiogroup" aria-label="Teams">
                {teams.items.map((team) => {
                  const checked = picked?.id === team.id;
                  return (
                    <ListItemButton key={team.id} onClick={() => setPicked(team)} selected={checked}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Radio edge="start" checked={checked} tabIndex={-1} disableRipple slotProps={{ input: { "aria-label": team.name } }} />
                      </ListItemIcon>
                      <GroupsOutlinedIcon sx={{ color: "text.secondary", mr: 1.5 }} />
                      <ListItemText primary={team.name} slotProps={{ primary: { noWrap: true, fontWeight: 600 } }} />
                    </ListItemButton>
                  );
                })}
              </List>
              <Pager
                page={teams.page}
                size={teams.size}
                total={teams.total}
                totalPages={teams.totalPages}
                shown={teams.items.length}
                noun="team"
                onPageChange={teams.setPage}
              />
            </LoadState>
          </Box>

          {submit.error && <Alert severity="error">{submit.error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: "auto" }} noWrap>
          {picked ? picked.name : "No team selected"}
        </Typography>
        <Button onClick={onClose} disabled={submit.submitting} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" onClick={handleAdd} disabled={!picked} loading={submit.submitting}>
          Add team
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTeamDialog;

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import SearchField from "../general/SearchField";
import LoadState from "../general/LoadState";
import Pager from "../general/Pager";
import UserAvatar from "../general/UserAvatar";
import { addProjectMembers } from "../../api/projectsApi";
import { listWorkspaceMembers } from "../../api/workspacesApi";
import { usePagedList } from "../../hooks/usePagedList";
import { useSubmit } from "../../hooks/useSubmit";
import { PROJECT_ERROR_MESSAGES } from "../../constants/projects";
import { memberLabel } from "../../utils/people";

const MAX_PEOPLE = 100; // the backend accepts 1 to 100 ids per request
const ERRORS = {
  ...PROJECT_ERROR_MESSAGES,
  // projects-docs.md §5.3: someone left the workspace in the meantime
  BAD_REQUEST: "Someone you picked is no longer in this workspace. Search again and retry.",
};

// "Add people" window: search the workspace's people, tick several, add them to the project as Members.
// People already in the project are skipped by the backend, so picking them does no harm.
const AddPeopleDialog = ({ project, onClose, onAdded }) => {
  const people = usePagedList(
    (params, signal) => listWorkspaceMembers(project.workspaceId, params, signal),
    [project.workspaceId],
    { size: 8, fallback: "Couldn't load the workspace's people. Please try again." },
  );
  // picked people by id, kept while searching and paging
  const [picked, setPicked] = useState(() => new Map());
  const submit = useSubmit(ERRORS);

  const toggle = (person) =>
    setPicked((prev) => {
      const next = new Map(prev);
      if (next.has(person.userId)) next.delete(person.userId);
      else if (next.size < MAX_PEOPLE) next.set(person.userId, person);
      return next;
    });

  const handleAdd = async () => {
    const { ok } = await submit.run(() => addProjectMembers(project.id, [...picked.keys()]));
    if (ok) onAdded();
  };

  const count = picked.size;
  const query = people.search.trim();
  const addLabel = count === 0 ? "Add people" : count === 1 ? "Add 1 person" : `Add ${count} people`;

  return (
    <Dialog open onClose={submit.submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>Add people to {project.name}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Pick people from the workspace. They join as {project.template === "SCRUM" ? "Developers" : "Members"}.
        </Typography>
        <Stack spacing={1.5}>
          <SearchField
            value={people.search}
            onChange={people.setSearch}
            placeholder="Search by name or email"
            sx={{ width: "100%" }}
          />

          <Box sx={{ minHeight: 320, border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
            <LoadState
              loading={people.loading}
              error={people.error}
              onRetry={people.reload}
              isEmpty={people.items.length === 0}
              emptyMessage={query ? `No one matches "${query}".` : "No people in this workspace."}
              rows={5}
            >
              <List dense disablePadding>
                {people.items.map((person) => {
                  const checked = picked.has(person.userId);
                  return (
                    <ListItemButton key={person.userId} onClick={() => toggle(person)} selected={checked}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Checkbox
                          edge="start"
                          checked={checked}
                          tabIndex={-1}
                          disableRipple
                          slotProps={{ input: { "aria-label": memberLabel(person) } }}
                        />
                      </ListItemIcon>
                      <UserAvatar user={person} size={32} sx={{ mr: 1.5 }} />
                      <ListItemText
                        primary={memberLabel(person)}
                        secondary={person.email}
                        slotProps={{ primary: { noWrap: true, fontWeight: 600 }, secondary: { noWrap: true } }}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
              <Pager
                page={people.page}
                size={people.size}
                total={people.total}
                totalPages={people.totalPages}
                shown={people.items.length}
                noun="person"
                nounPlural="people"
                onPageChange={people.setPage}
              />
            </LoadState>
          </Box>

          {submit.error && <Alert severity="error">{submit.error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: "auto" }}>
          {count === 0 ? "No one selected" : `${count} selected`}
        </Typography>
        <Button onClick={onClose} disabled={submit.submitting} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" onClick={handleAdd} disabled={count === 0} loading={submit.submitting}>
          {addLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPeopleDialog;

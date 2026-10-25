import { useEffect, useState } from "react";
import {
  Box, Button, Checkbox, CircularProgress, Divider, Drawer, IconButton, Stack, TextField, Typography,
} from "@mui/material";
import { CloseRounded } from "@mui/icons-material";
import { listWorkspaceMembers } from "../../api/workspacesApi";
import { errorMessage, isAbort } from "../../utils/apiError";
import { memberLabel } from "../../utils/people";
import { EMPTY_PAGE } from "../../utils/page";
import { PersonAvatar } from "./TeamVisuals";

const MAX_SELECTED = 100; // backend limit per request

// picker for adding existing workspace members to a team
const TeamMemberDrawer = ({ open, workspaceId, currentMembers, busy, onClose, onAdd }) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  // results are tagged with the search they belong to, so a stale response is never shown
  const [result, setResult] = useState({ key: "", pageIndex: -1, data: EMPTY_PAGE, error: "" });

  const searchKey = JSON.stringify([workspaceId, debouncedQuery]);
  const page = result.key === searchKey ? result.data : EMPTY_PAGE;
  const error = result.key === searchKey ? result.error : "";
  const loading = Boolean(open && workspaceId && (result.key !== searchKey || result.pageIndex !== pageIndex));

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open || !workspaceId) return undefined;
    const controller = new AbortController();
    listWorkspaceMembers(workspaceId, { q: debouncedQuery, page: pageIndex, size: 20 }, controller.signal)
      .then((data) => {
        setResult((previous) => ({
          key: searchKey,
          pageIndex,
          error: "",
          data: {
            ...data,
            // "load more" appends to the pages already shown for the same search
            content: pageIndex > 0 && previous.key === searchKey
              ? [...previous.data.content, ...data.content]
              : data.content,
          },
        }));
      })
      .catch((err) => {
        if (isAbort(err)) return;
        setResult((previous) => ({
          ...previous,
          key: searchKey,
          pageIndex,
          error: errorMessage(err, "Could not load workspace members."),
        }));
      });
    return () => controller.abort();
  }, [open, workspaceId, debouncedQuery, pageIndex, searchKey]);

  const existing = new Set(currentMembers.map((member) => Number(member.userId)));
  const available = page.content.filter((member) => !existing.has(Number(member.userId)));

  const toggle = (id) =>
    setSelected((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      return current.length < MAX_SELECTED ? [...current, id] : current;
    });

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={busy ? undefined : onClose}
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: 500 }, maxWidth: "100vw" } } }}
    >
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", p: { xs: 2, sm: 3 } }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Add team members</Typography>
            <Typography variant="body2" color="text.secondary">Choose existing workspace members.</Typography>
          </Box>
          <IconButton onClick={onClose} disabled={busy} aria-label="Close">
            <CloseRounded />
          </IconButton>
        </Stack>
        <Divider />

        <Box sx={{ p: { xs: 2, sm: 3 }, overflowY: "auto", flex: 1 }}>
          <TextField
            fullWidth
            size="small"
            label="Search workspace members"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPageIndex(0);
            }}
            sx={{ mb: 2 }}
          />
          {error && <Typography color="error" variant="body2" sx={{ mb: 2 }}>{error}</Typography>}
          {available.map((member) => (
            <Stack
              component="label"
              key={member.userId}
              direction="row"
              sx={{ gap: 1.25, alignItems: "center", py: 1, borderBottom: 1, borderColor: "divider", cursor: "pointer" }}
            >
              <PersonAvatar name={memberLabel(member)} size={31} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{memberLabel(member)}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                  {member.email}
                </Typography>
              </Box>
              <Checkbox
                checked={selected.includes(Number(member.userId))}
                onChange={() => toggle(Number(member.userId))}
                slotProps={{ input: { "aria-label": `Select ${memberLabel(member)}` } }}
              />
            </Stack>
          ))}
          {loading && (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          {!loading && !page.content.length && !error && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No workspace members found.</Typography>
          )}
          {page.page + 1 < page.totalPages && (
            <Button fullWidth disabled={loading} onClick={() => setPageIndex((n) => n + 1)} sx={{ mt: 1 }}>
              Load more
            </Button>
          )}
        </Box>

        <Divider />
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", p: 2, gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {selected.length} selected (max {MAX_SELECTED})
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button onClick={onClose} disabled={busy}>Cancel</Button>
            <Button variant="contained" disabled={busy || !selected.length} onClick={() => onAdd(selected)}>
              {busy ? "Adding..." : "Add members"}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default TeamMemberDrawer;

import { useEffect, useState } from "react";
import { Box, Button, Checkbox, CircularProgress, Divider, Drawer, IconButton, Stack, TextField, Typography } from "@mui/material";
import { CloseRounded } from "@mui/icons-material";
import { listWorkspaceMembers } from "../../api/teamsApi";
import { emptyPage, errorMessage, isAbort, teamMemberLabel } from "./teamApiHelpers";
import { PersonAvatar } from "./TeamVisuals";

export default function TeamMemberDrawer({ open, workspaceId, currentMembers, busy, onClose, onAdd }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [offset, setOffset] = useState(0);
  useEffect(() => { const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300); return () => clearTimeout(timer); }, [query]);
  const searchKey = JSON.stringify([workspaceId, debouncedQuery]);
  const [resultState, setResultState] = useState({ key: "", offset: -1, data: emptyPage, error: "" });
  const page = resultState.key === searchKey ? resultState.data : emptyPage;
  const error = resultState.key === searchKey ? resultState.error : "";
  const loading = Boolean(open && workspaceId && (resultState.key !== searchKey || resultState.offset !== offset));

  useEffect(() => {
    if (!open || !workspaceId) return undefined;
    const controller = new AbortController();
    listWorkspaceMembers(workspaceId, { q: debouncedQuery, page: offset, size: 20 }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setResultState((previous) => ({
          key: searchKey,
          offset,
          data: {
            ...result,
            content: offset > 0 && previous.key === searchKey
              ? [...previous.data.content, ...result.content]
              : result.content,
          },
          error: "",
        }));
      })
      .catch((err) => { if (!isAbort(err) && !controller.signal.aborted) setResultState((previous) => ({ ...previous, key: searchKey, offset, error: errorMessage(err, "Could not load workspace members.") })); });
    return () => controller.abort();
  }, [open, workspaceId, debouncedQuery, offset, searchKey]);
  const existing = new Set(currentMembers.map((member) => Number(member.userId)));
  const available = page.content.filter((member) => !existing.has(Number(member.userId)));
  const toggle = (id) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : current.length < 100 ? [...current, id] : current);
  return (
    <Drawer anchor="right" open={open} onClose={busy ? undefined : onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 500 }, maxWidth: "100vw" } }}>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", p: { xs: 2, sm: 3 } }}>
          <Box><Typography variant="h5" fontWeight={800}>Add team members</Typography><Typography variant="body2" color="text.secondary">Choose existing workspace members.</Typography></Box>
          <IconButton onClick={onClose} disabled={busy} aria-label="Close"><CloseRounded /></IconButton>
        </Stack>
        <Divider />
        <Box sx={{ p: { xs: 2, sm: 3 }, overflowY: "auto", flex: 1 }}>
          <TextField fullWidth size="small" label="Search workspace members" value={query} onChange={(event) => { setQuery(event.target.value); setOffset(0); }} sx={{ mb: 2 }} />
          {error && <Typography color="error" variant="body2" sx={{ mb: 2 }}>{error}</Typography>}
          {available.map((member) => (
            <Stack component="label" key={member.userId} direction="row" sx={{ gap: 1.25, alignItems: "center", py: 1, borderBottom: 1, borderColor: "divider", cursor: "pointer" }}>
              <PersonAvatar member={{ name: teamMemberLabel(member) }} size={31} />
              <Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="body2" fontWeight={600}>{teamMemberLabel(member)}</Typography><Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>{member.email}</Typography></Box>
              <Checkbox checked={selected.includes(Number(member.userId))} onChange={() => toggle(Number(member.userId))} inputProps={{ "aria-label": `Select ${teamMemberLabel(member)}` }} />
            </Stack>
          ))}
          {loading && <Box sx={{ textAlign: "center", py: 2 }}><CircularProgress size={24} /></Box>}
          {!loading && !page.content.length && !error && <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No workspace members found.</Typography>}
          {page.page + 1 < page.totalPages && <Button fullWidth disabled={loading} onClick={() => setOffset((value) => value + 1)} sx={{ mt: 1 }}>Load more</Button>}
        </Box>
        <Divider />
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", p: 2, gap: 1 }}>
          <Typography variant="caption" color="text.secondary">{selected.length} selected (max 100)</Typography>
          <Stack direction="row" spacing={1}><Button onClick={onClose} disabled={busy}>Cancel</Button><Button variant="contained" disabled={busy || !selected.length} onClick={() => onAdd(selected)}>{busy ? "Adding..." : "Add members"}</Button></Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}

import { useState } from "react";
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, TextField, Typography,
} from "@mui/material";
import { archiveWorkspace, deleteWorkspace, renameWorkspace, restoreWorkspace } from "../../api/workspacesApi";
import { errorMessage } from "../../utils/apiError";
import { isWorkspaceArchived } from "../../utils/workspace";

// admin-only: rename, archive/restore, and delete (only once archived, as the backend requires).
// Mount it only while open, so the name field starts from the current workspace name
const WorkspaceSettingsDialog = ({ workspace, onClose, onChanged, onDeleted }) => {
  const [name, setName] = useState(workspace.name);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const archived = isWorkspaceArchived(workspace);

  const run = async (action, after) => {
    setBusy(true);
    setError(null);
    try {
      after(await action());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const rename = () => {
    const trimmed = name.trim();
    if (!trimmed) return setError("Name is required.");
    if (trimmed.length > 100) return setError("Name must be at most 100 characters.");
    run(() => renameWorkspace(workspace.id, trimmed), onChanged);
  };
  const toggleArchive = () =>
    run(() => (archived ? restoreWorkspace(workspace.id) : archiveWorkspace(workspace.id)), onChanged);
  const remove = () => run(() => deleteWorkspace(workspace.id), () => onDeleted());

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Workspace settings</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Typography sx={{ fontWeight: 600, mt: 1 }}>Name</Typography>
        <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
          <TextField
            fullWidth
            size="small"
            value={name}
            disabled={archived}
            onChange={(e) => setName(e.target.value)}
          />
          <Button variant="contained" onClick={rename} disabled={busy || archived}>Save</Button>
        </Box>
        {archived && (
          <Typography variant="caption" color="text.secondary">Restore the workspace to rename it.</Typography>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography sx={{ fontWeight: 600 }}>{archived ? "Restore workspace" : "Archive workspace"}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
          {archived
            ? "Restoring makes the workspace editable again."
            : "An archived workspace becomes read-only. You can restore it at any time."}
        </Typography>
        <Button variant="outlined" onClick={toggleArchive} disabled={busy}>
          {archived ? "Restore" : "Archive"}
        </Button>

        {archived && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography sx={{ fontWeight: 600 }} color="error">Delete permanently</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
              This removes the workspace and everything inside it and cannot be undone. Type{" "}
              <b>{workspace.name}</b> to confirm.
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField fullWidth size="small" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              <Button
                variant="contained"
                color="error"
                onClick={remove}
                disabled={busy || confirm !== workspace.name}
              >
                Delete
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default WorkspaceSettingsDialog;

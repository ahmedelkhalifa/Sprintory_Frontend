import { useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, MenuItem, Stack } from "@mui/material";
import FormField from "../forms/FormField";
import ToneDialogTitle from "../general/ToneDialogTitle";
import { deleteBoardColumn } from "../../api/projectsApi";
import { useSubmit } from "../../hooks/useSubmit";
import { COLUMN_ERROR_MESSAGES } from "../../constants/tasks";
import { columnContentsLabel } from "../../utils/board";

// "Delete column" window. The backend only hides the column (soft delete) and there is no restore, so for the app
// it's gone. A column that holds anything (`contents` = { tasks, subtasks } on the whole board; subtasks too, though
// they don't count for WIP) needs a new place for it: everything moves to the picked column (the default is its left
// neighbour) and the move goes in each task's history.
// `onDeleted(target)` gets the column they went to (null when it was empty).
const DeleteColumnDialog = ({ projectId, column, columns, contents, onDeleted, onClose }) => {
  const others = columns.filter((c) => c.id !== column.id);
  const index = columns.findIndex((c) => c.id === column.id);
  const [targetId, setTargetId] = useState((columns[index - 1] ?? others[0])?.id ?? "");
  const submit = useSubmit(COLUMN_ERROR_MESSAGES);
  const what = columnContentsLabel(contents);
  const hasTasks = what !== "";

  const handleDelete = async () => {
    const { ok } = await submit.run(() => deleteBoardColumn(projectId, column.id, hasTasks ? targetId : null));
    if (ok) onDeleted(hasTasks ? others.find((c) => c.id === targetId) : null);
  };

  return (
    <Dialog open onClose={submit.submitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <ToneDialogTitle tone="danger">Delete “{column.name}”?</ToneDialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <DialogContentText>
            The column is removed from the board for everyone. This can't be undone.
          </DialogContentText>
          {hasTasks && (
            <FormField
              id="delete-column-target"
              label={`Move its ${what} to`}
              select
              value={targetId}
              onChange={(event) => {
                setTargetId(event.target.value);
                submit.clearError();
              }}
            >
              {others.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </FormField>
          )}
          {submit.error && <Alert severity="error">{submit.error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={submit.submitting} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleDelete} loading={submit.submitting} variant="contained" color="error">
          Delete column
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteColumnDialog;

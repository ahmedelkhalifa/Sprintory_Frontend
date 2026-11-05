import { useState } from "react";
import { Box, Button, TextField } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { createSubtask } from "../../../api/tasksApi";
import { useSubmit } from "../../../hooks/useSubmit";
import { TASK_ERROR_MESSAGES } from "../../../constants/tasks";
import { TASK_TITLE_MAX, validateSubtask } from "../../../utils/validation";

// "Add subtask" under a parent's subtasks, like Jira: a title field that creates one subtask per Enter and stays open
// for the next; Escape or Cancel closes it. A new subtask starts in the board's first column, unassigned.
const AddSubtask = ({ projectId, parentId, onCreated }) => {
  const [draft, setDraft] = useState(null); // null: closed
  const [error, setError] = useState("");
  const submit = useSubmit(TASK_ERROR_MESSAGES);

  const close = () => {
    setDraft(null);
    setError("");
    submit.clearError();
  };

  const create = async () => {
    if (submit.submitting) return;
    const found = validateSubtask({ title: draft });
    if (found.title) return setError(found.title);
    const { ok } = await submit.run(() => createSubtask(projectId, parentId, { title: draft.trim() }));
    if (!ok) return;
    setDraft("");
    onCreated();
  };

  if (draft === null) {
    return (
      <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setDraft("")} sx={{ mt: 1 }}>
        Add subtask
      </Button>
    );
  }

  const shownError = error || submit.error;
  return (
    <Box sx={{ mt: 1.5 }}>
      <TextField
        autoFocus
        fullWidth
        size="small"
        placeholder="What needs to be done?"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setError("");
          submit.clearError();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            create();
          }
          if (e.key === "Escape") close();
        }}
        error={Boolean(shownError)}
        helperText={shownError || "Enter adds it and keeps the field open for the next one."}
        slotProps={{ htmlInput: { maxLength: TASK_TITLE_MAX, "aria-label": "New subtask title" } }}
      />
      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
        <Button variant="contained" size="small" loading={submit.submitting} onClick={create}>
          Create
        </Button>
        <Button size="small" color="inherit" disabled={submit.submitting} onClick={close}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export default AddSubtask;

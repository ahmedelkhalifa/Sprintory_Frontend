import { useState } from "react";
import { Box, Button, MenuItem, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { createTask } from "../../api/tasksApi";
import { useSubmit } from "../../hooks/useSubmit";
import { TASK_ERROR_MESSAGES, TASK_TYPES } from "../../constants/tasks";
import { validateTask } from "../../utils/validation";

// "Create task" bar at the top of the backlog: pick a type, type a title, Enter.
// The field keeps focus, so several tasks can be added in a row; details are set later in the drawer.
const QuickAddTask = ({ projectId, onCreated }) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState(TASK_TYPES.STORY.value);
  const [titleError, setTitleError] = useState("");
  const submit = useSubmit(TASK_ERROR_MESSAGES);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateTask({ title }).title ?? "";
    setTitleError(error);
    if (error || submit.submitting) return;

    const { ok, error: apiError } = await submit.run(() => createTask(projectId, { title: title.trim(), type }));
    if (ok) {
      setTitle("");
      onCreated();
      return;
    }
    const fieldError = apiError.response?.data?.fieldErrors?.title;
    if (fieldError) {
      setTitleError(fieldError);
      submit.clearError();
    }
  };

  const message = titleError || submit.error;

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit}
      sx={{ display: "flex", alignItems: "flex-start", gap: 1, px: { xs: 1.5, sm: 2 }, py: 1.5 }}
    >
      <TextField
        select
        size="small"
        value={type}
        onChange={(e) => setType(e.target.value)}
        slotProps={{ htmlInput: { "aria-label": "Task type" } }}
        sx={{ width: 112, flexShrink: 0 }}
      >
        {Object.values(TASK_TYPES).map(({ value, label, Icon, tone }) => (
          <MenuItem key={value} value={value}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Icon fontSize="small" sx={{ color: tone }} />
              {label}
            </Box>
          </MenuItem>
        ))}
      </TextField>
      <TextField
        size="small"
        fullWidth
        placeholder="What needs to be done?"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (titleError) setTitleError("");
          if (submit.error) submit.clearError();
        }}
        error={Boolean(message)}
        helperText={message}
        slotProps={{ htmlInput: { "aria-label": "New task title", maxLength: 200 } }}
      />
      <Button type="submit" variant="outlined" startIcon={<AddIcon />} loading={submit.submitting} sx={{ flexShrink: 0, height: 40 }}>
        Add
      </Button>
    </Box>
  );
};

export default QuickAddTask;

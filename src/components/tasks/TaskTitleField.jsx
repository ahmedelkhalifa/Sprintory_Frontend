import { useRef, useState } from "react";
import { TextField, Typography } from "@mui/material";
import { TASK_TITLE_MAX } from "../../utils/validation";

// A task page's title: text until clicked, then a field. Enter or leaving it saves, Escape cancels.
// It stays open when the save fails, so nothing typed is lost. `onSave(title)` answers { ok }.
const TaskTitleField = ({ title, canEdit, error, onEdit, onSave }) => {
  const [draft, setDraft] = useState(null); // null: showing the title
  // after Escape, or while saving, the blur that follows must not save (again)
  const closing = useRef(false);

  const start = () => {
    if (!canEdit) return;
    closing.current = false;
    onEdit();
    setDraft(title);
  };
  const cancel = () => {
    closing.current = true;
    onEdit();
    setDraft(null);
  };
  const finish = async () => {
    if (closing.current || draft === null) return;
    if (draft.trim() === title) return cancel();
    closing.current = true;
    const { ok } = await onSave(draft);
    if (ok) setDraft(null);
    else closing.current = false;
  };

  if (draft === null) {
    return (
      <Typography
        variant="h4"
        component="h1"
        onClick={start}
        sx={{
          fontWeight: 700,
          wordBreak: "break-word",
          borderRadius: 1,
          px: 1,
          mx: -1,
          cursor: canEdit ? "text" : "default",
          "&:hover": canEdit ? { bgcolor: "action.hover" } : undefined,
        }}
      >
        {title}
      </Typography>
    );
  }
  return (
    <TextField
      autoFocus
      fullWidth
      value={draft}
      error={Boolean(error)}
      helperText={error}
      onChange={(e) => {
        setDraft(e.target.value);
        onEdit();
      }}
      onBlur={finish}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          finish();
        }
        if (e.key === "Escape") cancel();
      }}
      slotProps={{
        htmlInput: { maxLength: TASK_TITLE_MAX, "aria-label": "Title" },
        input: { sx: { fontSize: 28, fontWeight: 700 } },
      }}
    />
  );
};

export default TaskTitleField;

import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import FormField from "../forms/FormField";
import DetailRow from "./DetailRow";
import { formatDate } from "../../utils/format";

// the backend takes years 0001–9999; without a max some browsers let the year run to six digits
const DATE_INPUT = { htmlInput: { min: "0001-01-01", max: "9999-12-31" } };

// The task page's Start date and Due date rows (PMP-48, backend schedule-docs §1). The two dates are one pair, saved
// together: both or neither, the due date on or after the start. So they are kept as a draft while the user picks
// them and saved when the focus leaves the pair (or on Enter), not one date at a time; validateTask's error then shows
// under the date that needs fixing. Clear dates removes both. `onSave({ startDate, dueDate })` is the page's
// saveFields; without `canEdit` (a Viewer, a read-only project) the dates are plain text.
const TaskDateFields = ({ task, canEdit, disabled, errors, onEdit, onSave, readOnlyNote }) => {
  const [draft, setDraft] = useState(null); // { startDate, dueDate } while editing, until it's saved
  const values = draft ?? { startDate: task.startDate ?? "", dueDate: task.dueDate ?? "" };
  const hasDates = Boolean(task.startDate || task.dueDate);

  const change = (field) => (e) => {
    setDraft({ ...values, [field]: e.target.value });
    onEdit("startDate");
    onEdit("dueDate");
  };

  const save = async (next) => {
    const { ok, invalid } = await onSave(next);
    // keep an invalid pair to fix; after a refusal show the task's dates again
    if (ok || !invalid) setDraft(null);
  };

  // the focus left both inputs (not just moved from one date to the other)
  const handleBlur = (e) => {
    if (draft && !e.currentTarget.contains(e.relatedTarget)) save(draft);
  };

  if (!canEdit) {
    return (
      <>
        <DetailRow id="task-start-date" label="Start date">
          <Typography id="task-start-date" variant="body2" sx={{ pt: 1.25 }} color={task.startDate ? "text.primary" : "text.secondary"}>
            {formatDate(task.startDate) || "None"}
          </Typography>
        </DetailRow>
        <DetailRow id="task-due-date" label="Due date">
          <Typography id="task-due-date" variant="body2" sx={{ pt: 1.25 }} color={task.dueDate ? "text.primary" : "text.secondary"}>
            {formatDate(task.dueDate) || "None"}
          </Typography>
        </DetailRow>
        {readOnlyNote && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", pb: 0.5 }}>
            {readOnlyNote}
          </Typography>
        )}
      </>
    );
  }

  const field = (name) => ({
    id: name === "startDate" ? "task-start-date" : "task-due-date",
    type: "date",
    value: values[name],
    disabled,
    error: Boolean(errors[name]),
    helperText: errors[name],
    onChange: change(name),
    onKeyDown: (e) => e.key === "Enter" && e.target.blur(),
    slotProps: DATE_INPUT,
  });

  return (
    <Box onBlur={handleBlur}>
      <DetailRow id="task-start-date" label="Start date">
        <FormField {...field("startDate")} />
      </DetailRow>
      <DetailRow id="task-due-date" label="Due date">
        <FormField {...field("dueDate")} />
      </DetailRow>
      {(hasDates || draft) && (
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            size="small"
            color="inherit"
            disabled={disabled}
            onClick={() => save({ startDate: "", dueDate: "" })}
            sx={{ color: "text.secondary" }}
          >
            Clear dates
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default TaskDateFields;

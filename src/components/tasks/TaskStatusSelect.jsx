import { TextField } from "@mui/material";
import { columnOptions } from "./columnOptions";

// filled with the primary color when it can be changed, like Jira's status button
const filledSx = {
  bgcolor: "primary.main",
  borderRadius: 1,
  "& .MuiSelect-select": { color: "primary.contrastText", fontWeight: 600 },
  "& .MuiSvgIcon-root": { color: "primary.contrastText" },
  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
};

// The status at the top of a task page: the board's columns. `onChange(statusId)`.
const TaskStatusSelect = ({ value, columns, canEdit, disabled, onChange }) => (
  <TextField
    select
    size="small"
    value={value}
    disabled={disabled}
    onChange={(e) => onChange(e.target.value)}
    sx={{ minWidth: 160, ...(canEdit ? filledSx : {}) }}
    slotProps={{ htmlInput: { "aria-label": "Status" } }}
  >
    {columnOptions(columns)}
  </TextField>
);

export default TaskStatusSelect;

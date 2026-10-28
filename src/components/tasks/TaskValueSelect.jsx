import { Box, MenuItem } from "@mui/material";
import FormField from "../forms/FormField";

// A FormField select built from one of the task value maps (TASK_TYPES, TASK_PRIORITIES), each option with its
// icon. Every other prop goes to the FormField.
const TaskValueSelect = ({ values, ...fieldProps }) => (
  <FormField {...fieldProps} select>
    {Object.values(values).map(({ value, label, Icon, tone }) => (
      <MenuItem key={value} value={value}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Icon fontSize="small" sx={{ color: tone }} />
          {label}
        </Box>
      </MenuItem>
    ))}
  </FormField>
);

export default TaskValueSelect;

import { useRef, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import FormField from "../forms/FormField";
import { useSubmit } from "../../hooks/useSubmit";
import { COLUMN_ERROR_MESSAGES } from "../../constants/tasks";

// A one-field dialog for a column (the WIP limit): `validate(value)` returns an error text (empty = fine);
// `onSubmit(value)` gets the trimmed value and saves it (a promise). It closes once that worked, and shows the
// backend's message under the field when it didn't.
const ColumnFieldDialog = ({ title, label, initialValue, type = "text", helperText, validate, onSubmit, onClose }) => {
  const [value, setValue] = useState(String(initialValue ?? ""));
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const submit = useSubmit(COLUMN_ERROR_MESSAGES);
  const { clearError } = submit;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = value.trim();
    const problem = validate(trimmed);
    if (problem) return setError(problem);
    const { ok } = await submit.run(() => onSubmit(trimmed));
    if (ok) onClose();
  };

  const shownError = error || submit.error;

  return (
    <Dialog
      open
      onClose={submit.submitting ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: { component: "form", noValidate: true, onSubmit: handleSubmit },
        transition: {
          onEntered: () => {
            inputRef.current?.focus();
            inputRef.current?.select();
          },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        <FormField
          id="column-field"
          label={label}
          type={type}
          inputRef={inputRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError("");
            clearError();
          }}
          error={Boolean(shownError)}
          helperText={shownError || helperText}
          slotProps={type === "number" ? { htmlInput: { min: 1, step: 1 } } : undefined}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submit.submitting} color="inherit">
          Cancel
        </Button>
        <Button type="submit" variant="contained" loading={submit.submitting}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ColumnFieldDialog;

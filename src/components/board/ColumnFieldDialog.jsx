import { useRef, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";

// A one-field dialog for a column: `validate(value)` returns an error text or null, `onSubmit(value)` gets the trimmed value.
const ColumnFieldDialog = ({ title, label, initialValue, type = "text", helperText, validate, onSubmit, onClose }) => {
    const [value, setValue] = useState(String(initialValue ?? ""));
    const [error, setError] = useState(null);
    const inputRef = useRef(null);

    const submit = (event) => {
        event.preventDefault();
        const trimmed = value.trim();
        const problem = validate(trimmed);
        if (problem) return setError(problem);
        onSubmit(trimmed);
        onClose();
    };

    return (
        <Dialog
            open
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            slotProps={{
                paper: { component: "form", onSubmit: submit },
                transition: {
                    onEntered: () => {
                        inputRef.current?.focus();
                        inputRef.current?.select();
                    },
                },
            }}
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    margin="dense"
                    label={label}
                    type={type}
                    inputRef={inputRef}
                    value={value}
                    onChange={(event) => {
                        setValue(event.target.value);
                        setError(null);
                    }}
                    error={Boolean(error)}
                    helperText={error ?? helperText}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button type="submit" variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ColumnFieldDialog;

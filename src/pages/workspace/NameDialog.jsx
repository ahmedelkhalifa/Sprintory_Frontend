import { useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { errorMessage } from "../../utils/apiError";

function NameDialog({ open, title, label, submitLabel = "Create", onClose, onSubmit }) {
    const [name, setName] = useState("");
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const close = () => {
        setName("");
        setError(null);
        onClose();
    };

    const submit = async (e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return setError("Name is required.");
        if (trimmed.length > 100) return setError("Name must be at most 100 characters.");
        setBusy(true);
        setError(null);
        try {
            await onSubmit(trimmed);
            close();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onClose={close} fullWidth maxWidth="xs"
                slotProps={{ paper: { component: "form", onSubmit: submit } }}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <TextField autoFocus fullWidth margin="dense" label={label}
                           value={name} onChange={(e) => setName(e.target.value)} />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={close} color="inherit">Cancel</Button>
                <Button type="submit" variant="contained" disabled={busy}>{submitLabel}</Button>
            </DialogActions>
        </Dialog>
    );
}

export default NameDialog;
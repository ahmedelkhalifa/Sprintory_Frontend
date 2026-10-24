import { useState } from "react";
import {
    Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    TextField, Typography,
} from "@mui/material";
import { inviteMembers } from "../../api/workspaces";
import { errorMessage } from "../../utils/apiError";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function InviteDialog({ open, workspaceId, onClose }) {
    const [text, setText] = useState("");
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [busy, setBusy] = useState(false);

    const close = () => {
        setText("");
        setError(null);
        setResult(null);
        onClose();
    };

    const submit = async (e) => {
        e.preventDefault();
        const emails = [...new Set(
            text.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean)
        )];
        if (emails.length === 0) return setError("Enter at least one email address.");
        if (emails.length > 50) return setError("You can invite at most 50 people at once.");
        const bad = emails.find((m) => !EMAIL_RE.test(m));
        if (bad) return setError(`"${bad}" is not a valid email address.`);

        setBusy(true);
        setError(null);
        try {
            setResult(await inviteMembers(workspaceId, emails));
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onClose={close} fullWidth maxWidth="sm"
                slotProps={{ paper: { component: "form", onSubmit: result ? (e) => { e.preventDefault(); close(); } : submit } }}>
            <DialogTitle>Invite people</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {result ? (
                    <>
                        {result.invited.length > 0 && (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                Invitation sent to: {result.invited.join(", ")}
                            </Alert>
                        )}
                        {result.alreadyMembers.length > 0 && (
                            <Alert severity="info">
                                Already members (skipped): {result.alreadyMembers.join(", ")}
                            </Alert>
                        )}
                    </>
                ) : (
                    <>
                        <DialogContentText sx={{ mb: 2 }}>
                            Enter email addresses separated by commas, spaces or new lines.
                            Invitations are valid for 7 days.
                        </DialogContentText>
                        <TextField autoFocus fullWidth multiline minRows={3}
                                   label="Email addresses" placeholder="grace@example.com, linus@example.com"
                                   value={text} onChange={(e) => setText(e.target.value)} />
                        <Typography variant="caption" color="text.secondary">Up to 50 addresses.</Typography>
                    </>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                {result ? (
                    <Button type="submit" variant="contained">Done</Button>
                ) : (
                    <>
                        <Button onClick={close} color="inherit">Cancel</Button>
                        <Button type="submit" variant="contained" disabled={busy}>Send invitations</Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
}

export default InviteDialog;
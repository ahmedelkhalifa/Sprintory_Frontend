import { useState } from "react";
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Typography,
} from "@mui/material";
import { inviteMembers } from "../../api/workspacesApi";
import { errorMessage } from "../../utils/apiError";
import { validateEmail } from "../../utils/validation";

const MAX_EMAILS = 50; // backend limit per request

// "a@x.com, b@y.com\nc@z.com" -> unique, lower-cased addresses
const parseEmails = (text) => [
  ...new Set(text.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean)),
];

// admin-only: invite people by email, then show who was invited and who was already a member
const InviteDialog = ({ open, workspaceId, onClose }) => {
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
    // after sending, the same submit button means "Done"
    if (result) return close();

    const emails = parseEmails(text);
    if (emails.length === 0) return setError("Enter at least one email address.");
    if (emails.length > MAX_EMAILS) return setError(`You can invite at most ${MAX_EMAILS} people at once.`);
    const bad = emails.find((email) => validateEmail(email));
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
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { component: "form", onSubmit: submit } }}
    >
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
              <Alert severity="info">Already members (skipped): {result.alreadyMembers.join(", ")}</Alert>
            )}
          </>
        ) : (
          <>
            <DialogContentText sx={{ mb: 2 }}>
              Enter email addresses separated by commas, spaces or new lines. Invitations are valid for 7 days.
            </DialogContentText>
            <TextField
              autoFocus
              fullWidth
              multiline
              minRows={3}
              label="Email addresses"
              placeholder="grace@example.com, linus@example.com"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <Typography variant="caption" color="text.secondary">Up to {MAX_EMAILS} addresses.</Typography>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {result ? (
          <Button type="submit" variant="contained">Done</Button>
        ) : (
          <>
            <Button onClick={close} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" loading={busy}>Send invitations</Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default InviteDialog;

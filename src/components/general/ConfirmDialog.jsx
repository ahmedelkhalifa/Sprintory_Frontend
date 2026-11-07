import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText } from "@mui/material";
import ToneDialogTitle from "./ToneDialogTitle";

const BUTTON_COLOR = { danger: "error", warning: "warning" };

// "Are you sure?" window: a title, what will happen, Cancel and a confirm button.
// `tone` "danger" (deletes or removes something) makes the title badge and the confirm button red, "warning"
// (allowed, but worth a second look) amber; no tone is a normal blue confirmation. `Icon` replaces the badge's
// default icon. While `loading` the window can't be closed.
const ConfirmDialog = ({
  open = true,
  title,
  message,
  confirmLabel = "Confirm",
  tone,
  Icon,
  loading = false,
  error = "",
  onConfirm,
  onClose,
}) => {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <ToneDialogTitle tone={tone} Icon={Icon}>
        {title}
      </ToneDialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button onClick={onConfirm} loading={loading} variant="contained" color={BUTTON_COLOR[tone] ?? "primary"}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;

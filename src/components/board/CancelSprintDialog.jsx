import { useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, Stack, Typography } from "@mui/material";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import FormField from "../forms/FormField";
import ToneDialogTitle from "../general/ToneDialogTitle";
import { PreviewCounts } from "./SprintEndPreview";
import { useClosePreview } from "./useClosePreview";
import { cancelSprint } from "../../api/sprintsApi";
import { useSubmit } from "../../hooks/useSubmit";
import { TASK_ERROR_MESSAGES } from "../../constants/tasks";
import { errorCode } from "../../utils/apiError";
import { fieldErrorsAs, SPRINT_END_FIELD_TEXTS, SPRINT_TEXT_MAX, validateCancelSprint } from "../../utils/validation";

// a CONFLICT is handled by closing the window (onGone), so its generic text never shows
const MESSAGES = { ...TASK_ERROR_MESSAGES, CONFLICT: "This sprint has already ended." };

// The Product Owner's (or Project Manager's) "Cancel sprint" window (PMP-41, sprints-docs §2): for a sprint whose goal
// became obsolete. A reason is required; there is no destination, unfinished work always goes back to the top of the
// backlog. The preview's numbers are shown when they load, but cancelling doesn't wait for them.
// `onEnded(result)` gets { sprint, carriedOver, toSprint: null }; `onGone(text)` is for a sprint someone else ended.
const CancelSprintDialog = ({ sprint, onClose, onEnded, onGone }) => {
  const preview = useClosePreview(sprint.id, onGone);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const submit = useSubmit(MESSAGES);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submit.submitting) return;
    const found = validateCancelSprint({ reason });
    setError(found.reason ?? "");
    if (found.reason) return;

    const { ok, result, error: failure } = await submit.run(() => cancelSprint(sprint.id, reason.trim()));
    if (ok) {
      onEnded(result);
      return;
    }
    const code = errorCode(failure);
    if (code === "VALIDATION_ERROR" && failure.response.data.fieldErrors) {
      setError(fieldErrorsAs(failure.response.data.fieldErrors, SPRINT_END_FIELD_TEXTS).reason ?? "");
      submit.clearError();
    } else if (code === "CONFLICT") {
      // closed or cancelled by someone else, or the project became read-only: the backend says which
      onGone(failure.response.data?.message || "This sprint has already ended.");
    }
  };

  return (
    <Dialog open onClose={submit.submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" noValidate onSubmit={handleSubmit}>
        <ToneDialogTitle tone="danger" Icon={EventBusyOutlinedIcon}>
          Cancel “{sprint.name}”?
        </ToneDialogTitle>
        <DialogContent>
          <Stack spacing={2.5}>
            <Typography color="text.secondary">
              Cancel this sprint because its goal became obsolete? Unfinished work goes back to the top of the backlog.
              Done items stay with the sprint, but it won't count toward velocity.
            </Typography>
            {preview.data && <PreviewCounts preview={preview.data} />}
            <FormField
              id="cancel-sprint-reason"
              label="Reason"
              required
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              placeholder="Why is the Sprint Goal no longer worth reaching?"
              multiline
              minRows={3}
              autoFocus
              error={Boolean(error)}
              helperText={error || `${reason.length} / ${SPRINT_TEXT_MAX}`}
              slotProps={{ htmlInput: { maxLength: SPRINT_TEXT_MAX } }}
            />
            {submit.error && <Alert severity="error">{submit.error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={submit.submitting} color="inherit">
            Keep sprint
          </Button>
          <Button type="submit" variant="contained" color="error" loading={submit.submitting} disabled={!reason.trim()}>
            Cancel sprint
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default CancelSprintDialog;

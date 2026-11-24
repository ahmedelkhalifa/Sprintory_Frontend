import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, Typography } from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import ToneDialogTitle from "../general/ToneDialogTitle";
import OpenSubtasksDialog from "./OpenSubtasksDialog";

// "This task is blocked. Move it anyway?" with the open blockers (PMP-45, soft blocking): the move is allowed, the
// team decides. The list comes from the backend's 409 BLOCKED_TASK_CONFIRMATION_REQUIRED (`openBlockers`)
const BlockedMoveDialog = ({ open, task, openBlockers, columnName, loading, error, onConfirm, onClose }) => (
  <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
    <ToneDialogTitle tone="warning" Icon={BlockIcon}>
      Move a blocked task?
    </ToneDialogTitle>
    <DialogContent>
      <DialogContentText>
        {task.key} is blocked by {openBlockers.length === 1 ? "a task that isn't" : `${openBlockers.length} tasks that aren't`} done
        yet. Move it to {columnName ?? "the new column"} anyway?
      </DialogContentText>
      {openBlockers.length > 0 && (
        <Box component="ul" sx={{ m: 0, mt: 1.5, pl: 2.5 }}>
          {openBlockers.map((blocker) => (
            <Typography key={blocker.id} component="li" variant="body2" sx={{ overflowWrap: "anywhere" }}>
              <Box component="span" sx={{ fontWeight: 700 }}>
                {blocker.key}
              </Box>{" "}
              {blocker.title}
              {blocker.statusName && (
                <Box component="span" sx={{ color: "text.secondary" }}>
                  {" "}
                  · {blocker.statusName}
                </Box>
              )}
            </Typography>
          ))}
        </Box>
      )}
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
      <Button onClick={onConfirm} loading={loading} variant="contained" color="warning">
        Move anyway
      </Button>
    </DialogActions>
  </Dialog>
);

// A move the backend wants confirmed (`confirmation` from moveConfirmation in utils/dependency.js): a blocked task
// going forward, or a parent with open subtasks going into Done. Both are warnings, never refusals; after "Move
// anyway" the caller sends the same request with the confirmation's flag. Used by the board, the task page and the
// drawer. `columnName` is where the task is going.
const MoveConfirmDialog = ({ open = true, task, confirmation, columnName, loading, error, onConfirm, onClose }) =>
  confirmation.kind === "blocked" ? (
    <BlockedMoveDialog
      open={open}
      task={task}
      openBlockers={confirmation.openBlockers}
      columnName={columnName}
      loading={loading}
      error={error}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  ) : (
    <OpenSubtasksDialog open={open} task={task} columnName={columnName} loading={loading} onConfirm={onConfirm} onClose={onClose} />
  );

export default MoveConfirmDialog;

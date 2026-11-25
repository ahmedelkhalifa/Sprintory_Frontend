import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { useOpenRetro } from "./useOpenRetro";

// Asked once, right after a manager completed or cancelled a sprint. "Not now" loses nothing: the sprint's page and
// the Previous sprints list keep offering "Create retro".
const RetroPromptDialog = ({ open = true, sprint, workspace, project, onClose }) => {
  const retro = useOpenRetro(workspace, project);

  return (
    <Dialog open={open} onClose={retro.opening ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Start the retrospective?</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ overflowWrap: "anywhere" }}>
          “{sprint.name}” has ended. Collect what went well, what to improve and new ideas while it's fresh.
        </DialogContentText>
        {retro.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {retro.error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={retro.opening} color="inherit">
          Not now
        </Button>
        <Button variant="contained" onClick={() => retro.open(sprint.id)} loading={retro.opening}>
          Start retrospective
        </Button>
      </DialogActions>
    </Dialog>
  );
};



export default RetroPromptDialog;

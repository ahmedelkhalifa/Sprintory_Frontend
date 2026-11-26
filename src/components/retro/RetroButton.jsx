import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import { useOpenRetro } from "./useOpenRetro";
import { retroEntry, retroPath } from "../../utils/retro";

// An ended sprint's "Create retro" (managers, while it has none) or "Open retro" (everyone who can see the work, a
// plain link); nothing otherwise. `writable` is the project page's: a read-only project still opens its retros.
const RetroButton = ({ sprint, workspace, project, writable }) => {
  const { opening, error, open } = useOpenRetro(workspace, project);
  const entry = retroEntry(sprint, project, { writable });
  if (!entry) return null;

  // the list has one per sprint, so the name says whose it is
  if (entry === "open") {
    return (
      <Button
        component={RouterLink}
        to={retroPath(workspace, project, sprint.retroId)}
        variant="contained"
        size="small"
        aria-label={`Open retro: ${sprint.name}`}
      >
        Open retro
      </Button>
    );
  }

  return (
    <Box>
      <Button
        variant="contained"
        size="small"
        loading={opening}
        onClick={() => open(sprint.id)}
        aria-label={`Create retro: ${sprint.name}`}
      >
        Create retro
      </Button>
      {error && (
        <Typography variant="caption" color="error" role="alert" sx={{ display: "block", mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default RetroButton;

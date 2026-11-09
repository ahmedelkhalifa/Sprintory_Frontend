import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Paper, Snackbar, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LoadState from "../general/LoadState";
import NoWorkAccess from "../tasks/NoWorkAccess";
import SprintSummary from "./SprintSummary";
import { getSprint } from "../../api/sprintsApi";
import { useAsync } from "../../hooks/useAsync";
import { PERMISSIONS } from "../../constants/projects";
import { can } from "../../utils/project";

const NOT_FOUND = "This sprint doesn't exist, or you no longer have access to it.";

const NotFound = () => (
  <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, border: 1, borderColor: "divider", borderRadius: 2 }}>
    <Typography variant="h6" sx={{ fontWeight: 700 }}>
      Sprint not found
    </Typography>
    <Typography color="text.secondary" sx={{ mt: 0.5 }}>
      {NOT_FOUND}
    </Typography>
  </Paper>
);

// A sprint's own page, under the Sprints tab (…/sprints/:sprintId). The backend stops listing a sprint once it's closed
// or cancelled, so this is where what it saved can be read again (GET /sprints/{id}, any status). The Board comes
// here right after ending a sprint, with its message in the router state; a task's history links here from "carried
// it over from …". `onBack` opens the Sprints tab.
const SprintSummaryPage = ({ project, sprintId, onBack }) => {
  const canView = can(project, PERMISSIONS.VIEW_WORK);
  const validId = /^\d+$/.test(sprintId ?? "");
  const state = useAsync((signal) => getSprint(Number(sprintId), signal), [sprintId], {
    enabled: canView && validId,
    fallback: "Couldn't load the sprint. Please try again.",
  });
  const location = useLocation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(location.state?.notice ?? null);

  // the message from ending the sprint shows once: a refresh shouldn't bring it back
  const closeNotice = () => {
    setNotice(null);
    navigate(location.pathname, { replace: true });
  };

  let content;
  if (!canView) content = <NoWorkAccess />;
  else if (!validId) content = <NotFound />;
  else if (!state.data) {
    const missing = state.errorCode === "RESOURCE_NOT_FOUND" || state.errorCode === "BAD_REQUEST";
    content = missing ? (
      <NotFound />
    ) : (
      <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
        <LoadState loading={!state.error} error={state.error} onRetry={state.reload} rows={3} />
      </Paper>
    );
  } else if (state.data.projectId !== project.id) {
    // a sprint of another project, typed into this project's url
    content = <NotFound />;
  } else {
    content = <SprintSummary sprint={state.data} />;
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={onBack} color="inherit" size="small">
          All sprints
        </Button>
      </Box>
      {content}
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={6000}
        onClose={closeNotice}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" onClose={closeNotice} sx={{ width: "100%" }}>
          {notice}
        </Alert>
      </Snackbar>
    </Stack>
  );
};

export default SprintSummaryPage;

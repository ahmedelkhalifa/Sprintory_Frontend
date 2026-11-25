import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Paper, Snackbar, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LoadState from "../general/LoadState";
import NoWorkAccess from "../tasks/NoWorkAccess";
import SprintSummary from "./SprintSummary";
import RetroButton from "../retro/RetroButton";
import RetroPromptDialog from "../retro/RetroPromptDialog";
import { getSprint } from "../../api/sprintsApi";
import { useAsync } from "../../hooks/useAsync";
import { useLatched } from "../../hooks/useLatched";
import { PERMISSIONS } from "../../constants/projects";
import { can } from "../../utils/project";
import { retroEntry } from "../../utils/retro";

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
// here right after ending a sprint, with its message in the router state (and `askRetro`, so a manager is asked once
// to start the retrospective); a task's history links here from "carried it over from …". `onBack` opens the Sprints
// tab, `writable` is false in an archived project or workspace.
const SprintSummaryPage = ({ workspace, project, sprintId, writable, onBack }) => {
  const canView = can(project, PERMISSIONS.VIEW_WORK);
  const validId = /^\d+$/.test(sprintId ?? "");
  const state = useAsync((signal) => getSprint(Number(sprintId), signal), [sprintId], {
    enabled: canView && validId,
    fallback: "Couldn't load the sprint. Please try again.",
  });
  const location = useLocation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(location.state?.notice ?? null);
  const [askRetro, setAskRetro] = useState(Boolean(location.state?.askRetro));

  // the message from ending the sprint and the retro question show once: a refresh shouldn't bring them back
  const clearRouterState = () => navigate(location.pathname, { replace: true });
  const closeNotice = () => {
    setNotice(null);
    clearRouterState();
  };
  const closePrompt = () => {
    setAskRetro(false);
    clearRouterState();
  };

  const sprint = state.data?.projectId === project.id ? state.data : null;
  // only someone who may create it is asked, and only while the sprint has none
  const prompt = askRetro && retroEntry(sprint, project, { writable }) === "create" ? sprint : null;
  const shownPrompt = useLatched(prompt);

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
  } else if (!sprint) {
    // a sprint of another project, typed into this project's url
    content = <NotFound />;
  } else {
    content = (
      <SprintSummary
        sprint={sprint}
        action={<RetroButton sprint={sprint} workspace={workspace} project={project} writable={writable} />}
      />
    );
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={onBack} color="inherit" size="small">
          All sprints
        </Button>
      </Box>
      {content}
      {shownPrompt && (
        <RetroPromptDialog
          open={Boolean(prompt)}
          sprint={shownPrompt}
          workspace={workspace}
          project={project}
          onClose={closePrompt}
        />
      )}
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

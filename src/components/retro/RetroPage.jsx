import { useState } from "react";
import { Box, Button, FormControlLabel, Paper, Stack, Switch, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LoadState from "../general/LoadState";
import NoWorkAccess from "../tasks/NoWorkAccess";
import RetroColumn from "./RetroColumn";
import RetroHeader from "./RetroHeader";
import { getRetro } from "../../api/retrosApi";
import { useAsync } from "../../hooks/useAsync";
import { PERMISSIONS } from "../../constants/projects";
import { RETRO_COLUMNS } from "../../constants/retro";
import { can } from "../../utils/project";
import { columnItems } from "../../utils/retro";
import { LOADING_DELAY_SX, revealChildren } from "../../theme/motion";

const NotFound = () => (
  <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, border: 1, borderColor: "divider", borderRadius: 2 }}>
    <Typography variant="h6" component="h2">
      Retrospective not found
    </Typography>
    <Typography color="text.secondary" sx={{ mt: 0.5 }}>
      This retrospective doesn't exist, or you no longer have access to it.
    </Typography>
  </Paper>
);

// the loaded retro: how the sprint ended, then the three columns
const RetroBoard = ({ retro, workspace, project }) => {
  const [byVotes, setByVotes] = useState(false);

  return (
    <Stack spacing={2} sx={revealChildren(0)}>
      <RetroHeader retro={retro} workspace={workspace} project={project} />
      <Box>
        <FormControlLabel
          control={<Switch size="small" checked={byVotes} onChange={(e) => setByVotes(e.target.checked)} />}
          label="Sort by votes"
          sx={{ ml: 0, gap: 0.75 }}
        />
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" },
          gap: 2,
          alignItems: "start",
        }}
      >
        {RETRO_COLUMNS.map(({ value, label }) => (
          <RetroColumn key={value} label={label} items={columnItems(retro.items, value, { byVotes })} />
        ))}
      </Box>
    </Stack>
  );
};

// A sprint's retrospective (PMP-148, backend retrospectives-docs.md), under the Sprints tab (…/sprints/retros/:retroId).
// Everyone with VIEW_WORK can read it, also in a read-only project. `onBack` opens the Sprints tab.
const RetroPage = ({ workspace, project, retroId, onBack }) => {
  const canView = can(project, PERMISSIONS.VIEW_WORK);
  const validId = /^\d+$/.test(retroId ?? "");
  const state = useAsync((signal) => getRetro(Number(retroId), signal), [retroId], {
    enabled: canView && validId,
    fallback: "Couldn't load the retrospective. Please try again.",
  });

  let content;
  if (!canView) content = <NoWorkAccess />;
  else if (!validId) content = <NotFound />;
  else if (!state.data) {
    const missing = state.errorCode === "RESOURCE_NOT_FOUND" || state.errorCode === "BAD_REQUEST";
    content = missing ? (
      <NotFound />
    ) : (
      <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2, ...LOADING_DELAY_SX }}>
        <LoadState loading={!state.error} error={state.error} onRetry={state.reload} rows={4} />
      </Paper>
    );
  } else if (state.data.projectId !== project.id) {
    // a retro of another project, typed into this project's url
    content = <NotFound />;
  } else {
    content = <RetroBoard retro={state.data} workspace={workspace} project={project} />;
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={onBack} color="inherit" size="small">
          All sprints
        </Button>
      </Box>
      {content}
    </Stack>
  );
};

export default RetroPage;

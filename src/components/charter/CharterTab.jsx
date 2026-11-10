import { useState } from "react";
import { Alert, Box, Paper, Snackbar, Stack, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LoadState from "../general/LoadState";
import CharterGoals from "./CharterGoals";
import CharterScope from "./CharterScope";
import CharterStakeholders from "./CharterStakeholders";
import CharterHistory from "./CharterHistory";
import { getCharter, reorderCharterGoals } from "../../api/charterApi";
import { useAsync } from "../../hooks/useAsync";
import { CHARTER_ERROR_MESSAGES } from "../../constants/charter";
import { errorMessage } from "../../utils/apiError";
import { canEditCharter, charterReadOnlyReason, goalIds, moveGoal, sortGoals } from "../../utils/charter";

// The project's Charter tab (PMP-117, backend project-charter-docs.md): a lightweight project charter with goals,
// in / out of scope, the stakeholder register and the goal / scope history. Members only, Viewers included (anyone
// else gets 404, which also keeps the stakeholders' contact details private). The backend's `canEdit` decides the
// edit controls: the Project Manager, and the Product Owner in Scrum, while the project and workspace are active.
// `writable` (from the project page) also hides them when the frontend already knows the project is archived.
// The charter lives in this tab's state only, never in a shared store.
const CharterTab = ({ project, workspace, writable }) => {
  const state = useAsync((signal) => getCharter(project.id, signal), [project.id], {
    fallback: "Couldn't load the charter. Please try again.",
    messages: { ...CHARTER_ERROR_MESSAGES, RESOURCE_NOT_FOUND: "The charter is only available to project members." },
  });
  // bumped after a goal or scope change, so the history loads its newest page again
  const [historyVersion, setHistoryVersion] = useState(0);
  // an optimistic goal order, valid only for the charter it was made from: a reload replaces it
  const [order, setOrder] = useState(null); // { base, goals, saving }
  const [notice, setNotice] = useState(null); // { text, severity }

  const charter = state.data;

  if (!charter) {
    return (
      <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
        <LoadState loading={!state.error} error={state.error} onRetry={state.reload} rows={5} />
      </Paper>
    );
  }

  const editable = canEditCharter(charter) && writable;
  const readOnlyReason = charterReadOnlyReason(charter, project);
  const goals = order?.base === charter ? order.goals : sortGoals(charter.goals);

  const showNotice = (text, severity = "success") => setNotice({ text, severity });

  // after any change: the charter again; goal and scope changes also add history entries
  const afterChange = () => {
    state.reload();
    setHistoryVersion((v) => v + 1);
  };

  const reorder = async (from, to) => {
    const moved = moveGoal(goals, from, to);
    if (moved === goals) return;
    setOrder({ base: charter, goals: moved, saving: true });
    try {
      const saved = await reorderCharterGoals(project.id, goalIds(moved));
      setOrder({ base: charter, goals: sortGoals(saved), saving: false });
      afterChange();
    } catch (err) {
      // back to the saved order; someone may have added or removed a goal meanwhile, so load it again
      setOrder(null);
      showNotice(errorMessage(err, "Couldn't save the new order. Please try again.", CHARTER_ERROR_MESSAGES), "error");
      state.reload();
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="body2" color="text.secondary">
          What the project will deliver, what it won't, and who has a stake in it, so everyone shares the same
          understanding. Changes to goals and scope are kept in the charter history.
        </Typography>
        {readOnlyReason && (
          <Alert severity="info" icon={<LockOutlinedIcon fontSize="inherit" />} sx={{ mt: 1.5 }}>
            {readOnlyReason} You can read it.
          </Alert>
        )}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 2fr) minmax(0, 3fr)" },
          gap: 3,
          alignItems: "start",
        }}
      >
        <CharterGoals
          project={project}
          goals={goals}
          editable={editable}
          reordering={Boolean(order?.base === charter && order.saving)}
          onReorder={reorder}
          onChanged={afterChange}
          onNotice={showNotice}
        />
        <CharterScope project={project} charter={charter} editable={editable} onSaved={afterChange} onNotice={showNotice} />
      </Box>

      <CharterStakeholders
        project={project}
        workspace={workspace}
        stakeholders={charter.stakeholders ?? []}
        editable={editable}
        onChanged={state.reload}
        onNotice={showNotice}
      />

      <CharterHistory project={project} goals={goals} version={historyVersion} />

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={5000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={notice?.severity ?? "success"} variant="filled" onClose={() => setNotice(null)} sx={{ width: "100%" }}>
          {notice?.text}
        </Alert>
      </Snackbar>
    </Stack>
  );
};

export default CharterTab;

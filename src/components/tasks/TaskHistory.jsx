import { useEffect, useRef } from "react";
import { Avatar, Box, Typography } from "@mui/material";
import ArrowRightAltRoundedIcon from "@mui/icons-material/ArrowRightAltRounded";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import LoadState from "../general/LoadState";
import UserAvatar from "../general/UserAvatar";
import { getTaskHistory } from "../../api/tasksApi";
import { useAsync } from "../../hooks/useAsync";
import { TASK_ERROR_MESSAGES } from "../../constants/tasks";
import { formatDate, timeAgo } from "../../utils/format";
import { memberLabel } from "../../utils/people";
import { describeHistory } from "../../utils/task";

// a column name as it was at the time of the move
const ColumnName = ({ children }) => (
  <Box
    component="span"
    sx={{
      px: 0.75,
      py: 0.25,
      borderRadius: 1,
      bgcolor: "action.selected",
      fontSize: 12,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    }}
  >
    {children}
  </Box>
);

// The task's history (R10), oldest first: who moved it from which column to which, and when. Only status moves for
// now; other field changes, subtasks and comments come with the activity feed (PMP-133). `members` name the people;
// `version` changes when the page saves the task, so a new move shows up.
const TaskHistory = ({ project, taskId, members, version }) => {
  const state = useAsync((signal) => getTaskHistory(project.id, taskId, signal), [project.id, taskId], {
    fallback: "Couldn't load the history. Please try again.",
    messages: TASK_ERROR_MESSAGES,
  });
  // a reload, not a dependency: the list stays on screen while the new move loads in
  const { reload } = state;
  const seenVersion = useRef(version);
  useEffect(() => {
    if (version === seenVersion.current) return;
    seenVersion.current = version;
    reload();
  }, [version, reload]);

  if (!state.data) return <LoadState loading={!state.error} error={state.error} onRetry={reload} rows={2} />;
  if (state.data.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No status changes yet.
      </Typography>
    );
  }

  return (
    <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 2 }}>
      {describeHistory(state.data, members).map((entry) => (
        <Box component="li" key={entry.id} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
          {entry.actor ? (
            <UserAvatar user={entry.actor} size={30} />
          ) : (
            <Avatar sx={{ width: 30, height: 30, bgcolor: "action.selected", color: "text.secondary" }}>
              <PersonOutlineIcon sx={{ fontSize: 18 }} />
            </Avatar>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {entry.actor ? memberLabel(entry.actor) : "Someone"}
              </Box>{" "}
              changed the status{" "}
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
                title={`${formatDate(entry.changedAt)} ${new Date(entry.changedAt).toLocaleTimeString()}`}
              >
                · {timeAgo(entry.changedAt)}
              </Typography>
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.75, flexWrap: "wrap" }}>
              <ColumnName>{entry.fromColumnName}</ColumnName>
              <ArrowRightAltRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} aria-label="to" />
              <ColumnName>{entry.toColumnName}</ColumnName>
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default TaskHistory;

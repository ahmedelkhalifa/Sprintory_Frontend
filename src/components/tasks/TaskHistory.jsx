import { useEffect, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Alert, Box, Button, Link, Typography } from "@mui/material";
import ArrowRightAltRoundedIcon from "@mui/icons-material/ArrowRightAltRounded";
import LoadState from "../general/LoadState";
import UserAvatar from "../general/UserAvatar";
import { getTaskHistory } from "../../api/tasksApi";
import { useAsync } from "../../hooks/useAsync";
import { useWorkspaceAccess } from "../../hooks/useResourceAccess";
import { TASK_ERROR_MESSAGES } from "../../constants/tasks";
import { errorMessage } from "../../utils/apiError";
import { formatDate, timeAgo } from "../../utils/format";
import { sprintPath } from "../../utils/sprint";
import { historyLine, mergeHistory } from "../../utils/task";

const PAGE_SIZE = 20;

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

// a value before / after a change, e.g. a priority or a title
const Value = ({ children }) => (
  <Typography component="span" variant="body2" sx={{ wordBreak: "break-word" }}>
    {children}
  </Typography>
);

// `project` and `workspace` build the link of an entry about a sprint (a carry-over opens the ended sprint's page)
const Entry = ({ entry, members, subtask, project, workspace }) => {
  const line = historyLine(entry, { subtask });
  // the actor's name is a snapshot from the time; a loaded member only adds the photo
  const member = members.find((m) => m.userId === entry.actor?.id);
  const name = entry.actor?.name || "Someone";
  const avatarUser = member ?? { userId: entry.actor?.id, firstName: name };
  const Shown = line.kind === "status" ? ColumnName : Value;

  return (
    <Box component="li" sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
      <UserAvatar user={avatarUser} size={30} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
          <Box component="span" sx={{ fontWeight: 600 }}>
            {name}
          </Box>{" "}
          {line.text}{" "}
          {line.sprintId != null && (
            <>
              <Link component={RouterLink} to={sprintPath(workspace, project, line.sprintId)} underline="hover">
                (see the sprint)
              </Link>{" "}
            </>
          )}
          <Typography
            component="span"
            variant="caption"
            color="text.secondary"
            title={`${formatDate(entry.occurredAt)} ${new Date(entry.occurredAt).toLocaleTimeString()}`}
          >
            · {timeAgo(entry.occurredAt)}
          </Typography>
        </Typography>
        {line.kind && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.75, flexWrap: "wrap" }}>
            <Shown>{line.from}</Shown>
            <ArrowRightAltRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} aria-label="to" />
            <Shown>{line.to}</Shown>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// The task's history (R10, backend task-history-docs.md): created, every field change, subtasks and attachments
// added / removed, deleted comments and restores, newest first, PAGE_SIZE at a time with "Load older". `members` add
// photos to the names; `version` changes when the page saves the task, so the new entries show up on top.
// `subtask` says whether this is a subtask's own feed.
const TaskHistory = ({ project, taskId, members, version, subtask = false }) => {
  const { workspace } = useWorkspaceAccess();
  const first = useAsync(
    (signal) => getTaskHistory(project.id, taskId, { page: 0, size: PAGE_SIZE }, signal),
    [project.id, taskId],
    { fallback: "Couldn't load the history. Please try again.", messages: TASK_ERROR_MESSAGES },
  );
  // older entries: the pages loaded with "Load older", plus what an earlier page 0 showed. The feed is append-only,
  // so after a save page 0 brings the new entries and the ones it pushed down stay on screen
  const [more, setMore] = useState({ items: [], total: 0, loading: false, error: "" });
  const [shownFirst, setShownFirst] = useState(first.data);
  if (first.data !== shownFirst) {
    setShownFirst(first.data);
    if (shownFirst) setMore((prev) => ({ ...prev, items: [...prev.items, ...shownFirst.content] }));
  }

  // a reload, not a dependency: the list stays on screen while the new entries load in on top
  const { reload } = first;
  const seenVersion = useRef(version);
  useEffect(() => {
    if (version === seenVersion.current) return;
    seenVersion.current = version;
    reload();
  }, [version, reload]);

  if (!first.data) return <LoadState loading={!first.error} error={first.error} onRetry={reload} rows={2} />;

  const entries = mergeHistory(first.data.content, more.items);
  const total = Math.max(first.data.totalElements, more.total);
  const hasMore = entries.length < total;

  const loadMore = async () => {
    setMore((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      // the page the next older entry is on; entries already shown are dropped by mergeHistory
      const page = Math.floor(entries.length / PAGE_SIZE);
      const data = await getTaskHistory(project.id, taskId, { page, size: PAGE_SIZE });
      setMore((prev) => ({ items: [...prev.items, ...data.content], total: data.totalElements, loading: false, error: "" }));
    } catch (err) {
      const error = errorMessage(err, "Couldn't load older history. Please try again.", TASK_ERROR_MESSAGES);
      setMore((prev) => ({ ...prev, loading: false, error }));
    }
  };

  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No activity yet.
      </Typography>
    );
  }

  return (
    <Box>
      <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        {entries.map((entry) => (
          <Entry
            key={entry.id}
            entry={entry}
            members={members}
            subtask={subtask}
            project={project}
            workspace={workspace}
          />
        ))}
      </Box>
      {more.error && (
        <Alert
          severity="error"
          sx={{ mt: 2 }}
          action={
            <Button color="inherit" size="small" onClick={loadMore}>
              Try again
            </Button>
          }
        >
          {more.error}
        </Alert>
      )}
      {hasMore && !more.error && (
        <Button size="small" onClick={loadMore} loading={more.loading} sx={{ mt: 2 }}>
          Load older
        </Button>
      )}
    </Box>
  );
};

export default TaskHistory;

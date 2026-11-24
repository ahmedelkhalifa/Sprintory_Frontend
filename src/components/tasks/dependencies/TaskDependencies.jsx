import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, IconButton, Link, Paper, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import BlockIcon from "@mui/icons-material/Block";
import LoadState from "../../general/LoadState";
import ToneChip from "../../general/ToneChip";
import ConfirmDialog from "../../general/ConfirmDialog";
import AddDependencyDialog from "./AddDependencyDialog";
import { getDependencies, removeDependency } from "../../../api/dependenciesApi";
import { useAsync } from "../../../hooks/useAsync";
import { useLatched } from "../../../hooks/useLatched";
import { useSubmit } from "../../../hooks/useSubmit";
import { useTasksChanged } from "../../../hooks/useTasksChanged";
import { TASK_STAGES } from "../../../constants/tasks";
import { DEPENDENCY_DIRECTIONS, DEPENDENCY_ERROR_MESSAGES, blockedTooltip } from "../../../utils/dependency";
import { taskPath } from "../../../utils/task";

const { BLOCKED_BY, BLOCKS } = DEPENDENCY_DIRECTIONS;

// one linked task: its key (to its page), title and status, and Remove for people who may change links
const DependencyRow = ({ workspace, project, link, canManage, onRemove }) => {
  const { task } = link;
  const stage = TASK_STAGES[task.statusCategory] ?? TASK_STAGES.TODO;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minHeight: 44, px: 1.5 }}>
      <Link
        component={RouterLink}
        to={taskPath(workspace, project, task.id)}
        underline="hover"
        variant="body2"
        sx={{ fontWeight: 600, flexShrink: 0 }}
      >
        {task.key}
      </Link>
      <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }} title={task.title}>
        {task.title}
      </Typography>
      <ToneChip label={task.statusName} tone={stage.tone} />
      {canManage && (
        <Tooltip title="Remove link">
          <IconButton size="small" aria-label={`Remove link with ${task.key}`} onClick={() => onRemove(link)}>
            <LinkOffIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

// "Blocked by" or "Blocks": the links of one direction and, for people who may change them, the add button
const DependencyGroup = ({ workspace, project, direction, links, canManage, onAdd, onRemove }) => (
  <Box sx={{ mt: 1.5 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, flexGrow: 1 }}>
        {direction.listTitle}
        <Box component="span" sx={{ ml: 0.75, color: "text.secondary", fontWeight: 500 }}>
          {links.length}
        </Box>
      </Typography>
      {canManage && (
        <Button size="small" startIcon={<AddIcon />} onClick={() => onAdd(direction.value)}>
          {direction.action}
        </Button>
      )}
    </Box>
    {links.length > 0 ? (
      <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        {links.map((link, index) => (
          <Box key={link.id} sx={{ borderTop: index > 0 ? 1 : 0, borderColor: "divider" }}>
            <DependencyRow workspace={workspace} project={project} link={link} canManage={canManage} onRemove={onRemove} />
          </Box>
        ))}
      </Paper>
    ) : (
      <Typography variant="body2" color="text.secondary">
        {direction.empty}
      </Typography>
    )}
  </Box>
);

// A task page's "Dependencies" section (PMP-45, backend dependencies-docs.md): the tasks that block this one and the
// tasks it blocks, each with its current status, and a Blocked chip while an open blocker remains (its tooltip
// lists them). Add / Remove follow the response's `canManage` (DEPENDENCY_MANAGE, a top-level task, a writable
// project and workspace). Only for top-level tasks: a subtask's page doesn't show it. After a change the lists
// reload and `onChanged(dependencies)` lets the page refresh the task's blocked state and its history.
const TaskDependencies = ({ workspace, project, task, onChanged }) => {
  const state = useAsync((signal) => getDependencies(task.id, signal), [task.id], {
    fallback: "Couldn't load the dependencies. Please try again.",
    messages: DEPENDENCY_ERROR_MESSAGES,
  });
  const [adding, setAdding] = useState(null); // the direction being added, or null
  const [removing, setRemoving] = useState(null); // the link waiting for a yes, or null
  const shownAdding = useLatched(adding);
  const shownRemoving = useLatched(removing);
  const remove = useSubmit(DEPENDENCY_ERROR_MESSAGES);
  const dependencies = state.data;
  const canManage = Boolean(dependencies?.canManage);

  const changed = async () => {
    state.reload();
    try {
      onChanged?.(await getDependencies(task.id));
    } catch {
      // the lists reload on their own; the page keeps the task's last blocked state
    }
  };
  // a deleted task came back (Undo): its links count again
  useTasksChanged(project.id, () => state.reload());

  const handleAdded = () => {
    setAdding(null);
    changed();
  };

  const confirmRemove = async () => {
    const { ok } = await remove.run(() => removeDependency(removing.id));
    if (!ok) return;
    setRemoving(null);
    changed();
  };

  const closeRemove = () => {
    setRemoving(null);
    remove.clearError();
  };

  // the link as a sentence from this task's side
  const removeMessage = (link) =>
    link.direction === BLOCKS.value
      ? `${task.key} will no longer block ${link.task.key}. Both tasks stay as they are.`
      : `${link.task.key} will no longer block ${task.key}. Both tasks stay as they are.`;

  return (
    <Box sx={{ mt: 4 }} component="section" aria-label="Dependencies">
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography sx={{ fontWeight: 600 }}>Dependencies</Typography>
        {dependencies?.blocked && (
          <Tooltip title={blockedTooltip(dependencies.openBlockers)}>
            <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: "error.main" }}>
              <BlockIcon sx={{ fontSize: 16 }} />
              <ToneChip label="Blocked" tone="error.main" />
            </Box>
          </Tooltip>
        )}
      </Box>

      {!dependencies ? (
        <Paper elevation={0} sx={{ mt: 1, border: 1, borderColor: "divider", borderRadius: 2 }}>
          <LoadState loading={!state.error} error={state.error} onRetry={state.reload} rows={2} />
        </Paper>
      ) : (
        <>
          <DependencyGroup
            workspace={workspace}
            project={project}
            direction={BLOCKED_BY}
            links={dependencies.blockedBy}
            canManage={canManage}
            onAdd={setAdding}
            onRemove={(link) => setRemoving({ ...link, direction: BLOCKED_BY.value })}
          />
          <DependencyGroup
            workspace={workspace}
            project={project}
            direction={BLOCKS}
            links={dependencies.blocks}
            canManage={canManage}
            onAdd={setAdding}
            onRemove={(link) => setRemoving({ ...link, direction: BLOCKS.value })}
          />
        </>
      )}

      {shownAdding && dependencies && (
        <AddDependencyDialog
          // a fresh window (empty pick and search) every time it opens
          key={`${shownAdding}-${dependencies.blockedBy.length}-${dependencies.blocks.length}`}
          open={Boolean(adding)}
          projectId={project.id}
          task={task}
          direction={shownAdding}
          dependencies={dependencies}
          onClose={() => setAdding(null)}
          onAdded={handleAdded}
        />
      )}
      {shownRemoving && (
        <ConfirmDialog
          open={Boolean(removing)}
          title="Remove this dependency?"
          message={removeMessage(shownRemoving)}
          confirmLabel="Remove"
          tone="danger"
          Icon={LinkOffIcon}
          loading={remove.submitting}
          error={remove.error}
          onConfirm={confirmRemove}
          onClose={closeRemove}
        />
      )}
    </Box>
  );
};

export default TaskDependencies;

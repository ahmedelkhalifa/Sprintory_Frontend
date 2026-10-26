import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Alert, Box, Button, Paper, Snackbar, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import SearchField from "../general/SearchField";
import LoadState from "../general/LoadState";
import ToneChip from "../general/ToneChip";
import ConfirmDialog from "../general/ConfirmDialog";
import TaskList from "./TaskList";
import TaskRow, { TaskRowContent } from "./TaskRow";
import SprintHeader, { EstimateSummary } from "./SprintHeader";
import QuickAddTask from "./QuickAddTask";
import TaskDrawer from "./TaskDrawer";
import SprintDialog from "./SprintDialog";
import StartSprintDialog from "./StartSprintDialog";
import { collisionDetection, dropTarget } from "./dnd";
import { getBacklog, moveTask as moveTaskRequest } from "../../api/tasksApi";
import { deleteSprint } from "../../api/sprintsApi";
import { useAsync } from "../../hooks/useAsync";
import { useSubmit } from "../../hooks/useSubmit";
import { PERMISSIONS } from "../../constants/projects";
import { TASK_ERROR_MESSAGES } from "../../constants/tasks";
import { errorMessage } from "../../utils/apiError";
import { can } from "../../utils/project";
import { canMoveTask, filterTasks, findTask, movePermission, moveTask, projectLabels } from "../../utils/task";

// why a drop was refused, by the permission it needed
const NOT_ALLOWED = {
  [PERMISSIONS.MANAGE_BACKLOG]: "Only the Product Owner can reorder the backlog.",
  [PERMISSIONS.MANAGE_SPRINTS]: "Only the Scrum Master can move work into or out of a sprint.",
};

// shown to people who manage the project without seeing its work (a workspace admin who isn't a member)
const NoWorkAccess = () => (
  <Paper elevation={0} sx={{ p: { xs: 4, sm: 6 }, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 2 }}>
    <VisibilityOffOutlinedIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
    <Typography variant="h6" sx={{ fontWeight: 700 }}>
      You can't see this project's work
    </Typography>
    <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 480, mx: "auto" }}>
      Workspace admins manage every project, but only see tasks and sprints in projects they are a member of.
      Ask a Project Manager to add you.
    </Typography>
  </Paper>
);

// The Backlog tab of a Scrum project (R13, planning from R14): planned and active sprints on top, the product
// backlog below. Tasks are dragged by their handle or moved from their menu; who may move what follows the
// project's permissions (ordering the backlog: Product Owner, anything with a sprint: Scrum Master).
// `writable` is false in an archived project or workspace, which makes everything read-only.
const BacklogTab = ({ project, writable }) => {
  const canView = can(project, PERMISSIONS.VIEW_WORK);
  const backlogState = useAsync((signal) => getBacklog(project.id, signal), [project.id], {
    enabled: canView,
    fallback: "Couldn't load the backlog. Please try again.",
    messages: TASK_ERROR_MESSAGES,
  });
  // moves show at once and are sent in the background; the loaded data wins again after the next load
  const [optimistic, setOptimistic] = useState({ source: null, state: null });
  const [search, setSearch] = useState("");
  const [openTaskId, setOpenTaskId] = useState(null);
  // which window is open: create-sprint / edit-sprint / start-sprint / delete-sprint (+ sprint)
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(null); // { taskId, fromSprintId }
  const [overSprintId, setOverSprintId] = useState(undefined); // list under the pointer (null = backlog)
  const removeSprint = useSubmit(TASK_ERROR_MESSAGES);
  const sensors = useSensors(
    // a short move before dragging starts, so clicks on the row still work
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!canView) return <NoWorkAccess />;

  const data = backlogState.data;
  const state = optimistic.source === data && optimistic.state ? optimistic.state : data;

  if (!state) {
    return (
      <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
        <LoadState loading={!backlogState.error} error={backlogState.error} onRetry={backlogState.reload} rows={6} />
      </Paper>
    );
  }

  const canEditTasks = writable && can(project, PERMISSIONS.EDIT_TASKS);
  const canPlan = writable && can(project, PERMISSIONS.MANAGE_SPRINTS);
  const canRank = writable && can(project, PERMISSIONS.MANAGE_BACKLOG);
  const mayMove = (fromSprintId, toSprintId) => writable && canMoveTask(project, fromSprintId, toSprintId);
  // a filtered list hides rows, so dropping "before" a row would be ambiguous: no dragging while searching
  const filtering = search.trim() !== "";
  const activeSprint = state.sprints.find((sprint) => sprint.status === "ACTIVE");
  const reload = backlogState.reload;

  const listOf = (sprintId) =>
    sprintId === null ? state.backlog : state.sprints.find((sprint) => sprint.id === sprintId).tasks;

  const applyMove = async (move) => {
    const from = findTask(state, move.taskId);
    if (!from) return;
    if (!mayMove(from.sprintId, move.sprintId)) {
      setNotice(NOT_ALLOWED[movePermission(from.sprintId, move.sprintId)]);
      return;
    }
    const before = state;
    setOptimistic({ source: data, state: moveTask(state, move) });
    try {
      await moveTaskRequest(project.id, move);
    } catch (err) {
      setOptimistic({ source: data, state: before });
      setNotice(errorMessage(err, "Couldn't move the task. Please try again.", TASK_ERROR_MESSAGES));
    }
  };

  // the menu's moves for a row, limited to what this user may do
  const movesFor = (task, sprintId) => {
    const moves = [];
    if (sprintId === null && mayMove(null, null)) {
      const index = state.backlog.findIndex((t) => t.id === task.id);
      if (index > 0) moves.push({ label: "Move to top of backlog", sprintId: null, beforeTaskId: state.backlog[0].id });
      if (index < state.backlog.length - 1) moves.push({ label: "Move to bottom of backlog", sprintId: null, beforeTaskId: null });
    }
    if (canPlan) {
      state.sprints
        .filter((sprint) => sprint.id !== sprintId)
        .forEach((sprint) => moves.push({ label: `Move to ${sprint.name}`, sprintId: sprint.id, beforeTaskId: null }));
      if (sprintId !== null) {
        moves.push({ label: "Move to top of backlog", sprintId: null, beforeTaskId: state.backlog[0]?.id ?? null });
      }
    }
    return moves.map((move) => ({ ...move, taskId: task.id }));
  };

  // rows in a sprint move only with MANAGE_SPRINTS; backlog rows with either permission
  const canDragFrom = (sprintId) => !filtering && (sprintId === null ? canRank || canPlan : canPlan);

  const lookup = (taskId) => findTask(state, taskId);

  const handleDragStart = ({ active }) => {
    const from = lookup(active.data.current.taskId);
    setDragging(from && { taskId: from.task.id, fromSprintId: from.sprintId });
  };

  const handleDragOver = ({ over }) => setOverSprintId(dropTarget(over, lookup)?.sprintId);

  const handleDragEnd = ({ active, over }) => {
    setDragging(null);
    setOverSprintId(undefined);
    const target = dropTarget(over, lookup);
    const from = lookup(active.data.current.taskId);
    if (!target || !from) return;

    const list = listOf(target.sprintId);
    let beforeTaskId = null;
    if (target.sprintId === from.sprintId) {
      if (target.overTaskId === null) return; // dropped on its own list's empty space
      const newIndex = list.findIndex((t) => t.id === target.overTaskId);
      if (newIndex === from.index) return;
      const reordered = arrayMove(list, from.index, newIndex);
      beforeTaskId = reordered[newIndex + 1]?.id ?? null;
    } else if (target.overTaskId !== null) {
      // into another list: before the row it was dropped on, or after it when dropped on its lower half
      const overIndex = list.findIndex((t) => t.id === target.overTaskId);
      const dragged = active.rect.current.translated;
      const below = dragged && dragged.top + dragged.height / 2 > over.rect.top + over.rect.height / 2;
      beforeTaskId = list[below ? overIndex + 1 : overIndex]?.id ?? null;
    }
    applyMove({ taskId: from.task.id, sprintId: target.sprintId, beforeTaskId });
  };

  const handleDragCancel = () => {
    setDragging(null);
    setOverSprintId(undefined);
  };

  // highlight the list a dragged task would land in, when it's another list and the move is allowed
  const highlighted = (sprintId) =>
    Boolean(dragging) &&
    overSprintId === sprintId &&
    dragging.fromSprintId !== sprintId &&
    mayMove(dragging.fromSprintId, sprintId);

  const rows = (tasks, sprintId) =>
    filterTasks(tasks, search).map((task) => (
      <TaskRow
        key={task.id}
        task={task}
        canDrag={canDragFrom(sprintId)}
        moves={movesFor(task, sprintId)}
        onMove={applyMove}
        onOpen={() => setOpenTaskId(task.id)}
      />
    ));

  const emptyText = (tasks, fallback) => (filtering && tasks.length > 0 ? `No tasks match "${search.trim()}".` : fallback);
  const draggedTask = dragging && lookup(dragging.taskId)?.task;
  const closeDialog = () => setDialog(null);
  const afterChange = () => {
    closeDialog();
    reload();
  };

  const handleDeleteSprint = async () => {
    const { ok } = await removeSprint.run(() => deleteSprint(dialog.sprint.id));
    if (ok) afterChange();
  };

  return (
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1.5, mb: 2 }}>
        <SearchField value={search} onChange={setSearch} placeholder="Search tasks" />
        {canPlan && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ type: "create-sprint" })}>
            Create sprint
          </Button>
        )}
      </Box>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <Stack spacing={2.5}>
          {state.sprints.map((sprint) => (
            <TaskList
              key={sprint.id}
              sprintId={sprint.id}
              tasks={filterTasks(sprint.tasks, search)}
              highlight={highlighted(sprint.id)}
              emptyText={emptyText(sprint.tasks, canPlan ? "Drag tasks here to plan this sprint." : "No tasks planned yet.")}
              header={
                <SprintHeader
                  sprint={sprint}
                  canPlan={canPlan}
                  startBlocked={Boolean(activeSprint)}
                  onStart={() => setDialog({ type: "start-sprint", sprint })}
                  onEdit={() => setDialog({ type: "edit-sprint", sprint })}
                  onDelete={() => setDialog({ type: "delete-sprint", sprint })}
                />
              }
            >
              {rows(sprint.tasks, sprint.id)}
            </TaskList>
          ))}

          <TaskList
            sprintId={null}
            tasks={filterTasks(state.backlog, search)}
            highlight={highlighted(null)}
            emptyText={emptyText(state.backlog, "The backlog is empty.")}
            header={
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, px: { xs: 2, sm: 2.5 }, py: 1.75 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  <Typography component="h3" sx={{ fontWeight: 700, fontSize: 16 }}>
                    Backlog
                  </Typography>
                  <ToneChip label={state.backlog.length} tone="primary.main" />
                </Box>
                <EstimateSummary tasks={state.backlog} />
              </Box>
            }
            // above the rows, so adding never needs scrolling past a long backlog
            toolbar={canEditTasks && <QuickAddTask projectId={project.id} onCreated={reload} />}
          >
            {rows(state.backlog, null)}
          </TaskList>
        </Stack>

        {/* the row that follows the pointer while dragging */}
        <DragOverlay dropAnimation={null}>{draggedTask && <TaskRowContent task={draggedTask} raised />}</DragOverlay>
      </DndContext>

      {openTaskId !== null && (
        <TaskDrawer
          project={project}
          taskId={openTaskId}
          labels={projectLabels(state)}
          canEdit={canEditTasks}
          onClose={() => setOpenTaskId(null)}
          onChanged={reload}
        />
      )}

      {(dialog?.type === "create-sprint" || dialog?.type === "edit-sprint") && (
        <SprintDialog projectId={project.id} sprint={dialog.sprint} onClose={closeDialog} onSaved={afterChange} />
      )}
      {dialog?.type === "start-sprint" && (
        <StartSprintDialog sprint={dialog.sprint} onClose={closeDialog} onStarted={afterChange} />
      )}
      {dialog?.type === "delete-sprint" && (
        <ConfirmDialog
          title={`Delete ${dialog.sprint.name}?`}
          message={
            dialog.sprint.tasks.length > 0
              ? "Its tasks go back to the top of the backlog. The tasks themselves are kept."
              : "This empty sprint will be removed."
          }
          confirmLabel="Delete sprint"
          destructive
          loading={removeSprint.submitting}
          error={removeSprint.error}
          onConfirm={handleDeleteSprint}
          onClose={() => {
            closeDialog();
            removeSprint.clearError();
          }}
        />
      )}

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={5000}
        onClose={() => setNotice("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="warning" variant="filled" onClose={() => setNotice("")} sx={{ width: "100%" }}>
          {notice}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BacklogTab;

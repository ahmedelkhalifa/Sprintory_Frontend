import { useEffect, useRef, useState } from "react";
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Alert, Box, Button, Paper, Snackbar, Typography } from "@mui/material";
import ViewColumnOutlinedIcon from "@mui/icons-material/ViewColumnOutlined";
import AddIcon from "@mui/icons-material/Add";
import LoadState from "../general/LoadState";
import QuickAddTask from "../tasks/QuickAddTask";
import TaskDrawer from "../tasks/TaskDrawer";
import NoWorkAccess from "../tasks/NoWorkAccess";
import TaskFilterBar from "../tasks/filters/TaskFilterBar";
import { collisionDetection, isBelow } from "../tasks/dnd";
import { loadWork } from "../tasks/loadWork";
import BoardColumn from "./BoardColumn";
import BoardCard, { BoardCardContent } from "./BoardCard";
import SprintBoardHeader from "./SprintBoardHeader";
import CompleteSprintDialog from "./CompleteSprintDialog";
import { moveOnBoard } from "../../api/tasksApi";
import { useAsync } from "../../hooks/useAsync";
import { useTaskFilterMatches } from "../../hooks/useTaskFilterMatches";
import { PERMISSIONS } from "../../constants/projects";
import { TASK_ERROR_MESSAGES } from "../../constants/tasks";
import { errorMessage } from "../../utils/apiError";
import { can } from "../../utils/project";
import { applyColumnEdits, boardMove, groupByColumn, moveColumnId, NO_COLUMN_EDITS } from "../../utils/board";
import { projectLabels, taskStage } from "../../utils/task";
import { EMPTY_TASK_FILTERS } from "../../utils/taskFilters";
import ColumnMenu from "./ColumnMenu";
import ColumnFieldDialog from "./ColumnFieldDialog";

// Scrum without an active sprint: nothing to work on yet, the sprint is started from the backlog
const NoActiveSprint = ({ onOpenBacklog }) => (
  <Paper elevation={0} sx={{ p: { xs: 4, sm: 6 }, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 2 }}>
    <ViewColumnOutlinedIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
    <Typography variant="h6" sx={{ fontWeight: 700 }}>
      No active sprint
    </Typography>
    <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2.5, maxWidth: 480, mx: "auto" }}>
      The board shows the work of the running sprint. Plan a sprint in the backlog and start it to see its tasks here.
    </Typography>
    <Button variant="contained" onClick={onOpenBacklog}>
      Go to backlog
    </Button>
  </Paper>
);

// The Board tab. Scrum (R15): the active sprint's tasks by column, with its progress and Complete sprint.
// Kanban (R16): every task by column, with the work-in-progress limits. Columns are the backend's (read-only
// until column editing exists); anyone with EDIT_TASKS drags cards across and within columns.
// `writable` is false in an archived project or workspace, which makes everything read-only.
// `taskVersion` goes up when a task is created outside the tab (the page's Create task window);
// `onCreateTask` opens that window, for the Kanban board's button on top (its quick bar stays).
// `filters` come from the filter bar (shared with the Backlog): the backend says which tasks match, the board shows
// only those, while the counts, WIP limits, sprint progress and drop positions keep using every task.
const BoardTab = ({ project, writable, taskVersion = 0, onCreateTask, filters, onFiltersChange, onOpenBacklog }) => {
  const canView = can(project, PERMISSIONS.VIEW_WORK);
  // a reload, not a dependency: the board stays on screen while the new task loads in
  const boardState = useAsync((signal) => loadWork(project, "board", signal), [project.id], {
    enabled: canView,
    fallback: "Couldn't load the board. Please try again.",
    messages: TASK_ERROR_MESSAGES,
  });
  const { reload: reloadBoard } = boardState;
  // no filter requests for someone who can't see the work
  const match = useTaskFilterMatches(project.id, "board", canView ? filters : EMPTY_TASK_FILTERS);
  const { reload: reloadMatches } = match;
  // only changes while the tab is open: the first load already has every task created before it
  const seenTaskVersion = useRef(taskVersion);
  useEffect(() => {
    if (taskVersion === seenTaskVersion.current) return;
    seenTaskVersion.current = taskVersion;
    reloadBoard();
    reloadMatches(); // the new task may match the filters
  }, [taskVersion, reloadBoard, reloadMatches]);
  // moves show at once and are sent in the background; the loaded data wins again after the next load
  const [optimistic, setOptimistic] = useState({ source: null, tasks: null });
  const [openTaskId, setOpenTaskId] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [notice, setNotice] = useState(null); // { text, severity }
  const [dragging, setDragging] = useState(null); // { taskId, fromStatusId }
  const [overStatusId, setOverStatusId] = useState(null);
  // UI-only column edits (the backend has no column endpoints yet); they are laid over the loaded columns
  const [columnEdits, setColumnEdits] = useState(NO_COLUMN_EDITS);
  const [columnDialog, setColumnDialog] = useState(null); // { type: "rename" | "wip", columnId }
  const sensors = useSensors(
    // a short move before dragging starts, so clicks on a card still open it
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // Enter opens a card, so only Space picks it up
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] },
    }),
  );

  if (!canView) return <NoWorkAccess />;

  const data = boardState.data;
  if (!data) {
    return (
      <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
        <LoadState loading={!boardState.error} error={boardState.error} onRetry={boardState.reload} rows={6} />
      </Paper>
    );
  }

  const scrum = project.template === "SCRUM";
  const sprint = scrum ? data.sprints.find((s) => s.status === "ACTIVE") : null;
  if (scrum && !sprint) return <NoActiveSprint onOpenBacklog={onOpenBacklog} />;

  const { columns, members } = data;
  const allTasks = optimistic.source === data && optimistic.tasks ? optimistic.tasks : data.tasks;
  // a Scrum board holds only the active sprint's tasks, a Kanban board all of them
  const inSprint = sprint && new Set(sprint.taskIds);
  const tasks = inSprint ? allTasks.filter((task) => inSprint.has(task.id)) : allTasks;
  const edits = columnEdits.projectId === project.id ? columnEdits : NO_COLUMN_EDITS;
  const shownColumns = applyColumnEdits(columns, edits);
  // `board` has every task (drop positions, counts); `shownBoard` only the ones the filters keep
  const board = groupByColumn(shownColumns, tasks);
  const visible = match.matches ? tasks.filter((task) => match.matches.has(task.id)) : tasks;
  const shownBoard = match.matches ? groupByColumn(shownColumns, visible) : board;
  const canMove = writable && can(project, PERMISSIONS.EDIT_TASKS);
  const canComplete = writable && can(project, PERMISSIONS.MANAGE_SPRINTS);
  // a change can change what matches too
  const reload = () => {
    reloadBoard();
    reloadMatches();
  };
  // TODO: use a dedicated "manage board" permission once the backend has one
  const canEditColumns = writable && can(project, PERMISSIONS.EDIT_TASKS);
  const updateEdits = (change) => setColumnEdits({ ...edits, ...change, projectId: project.id });
  // TODO(backend): each of these becomes an API call once column endpoints exist
  const renameColumn = (id, name) => updateEdits({ names: { ...edits.names, [id]: name } });
  const setWip = (id, limit) => updateEdits({ wip: { ...edits.wip, [id]: limit } });
  const moveColumn = (id, step) => updateEdits({ order: moveColumnId(shownColumns, id, step) });
  const removeColumn = (id) => updateEdits({ removed: [...edits.removed, id] });
  const dialogColumn = columnDialog && board.find((column) => column.id === columnDialog.columnId);
  const validateName = (id) => (value) => {
    if (!value) return "Name is required.";
    if (value.length > 100) return "Name must be at most 100 characters.";
    if (shownColumns.some((c) => c.id !== id && c.name.toLowerCase() === value.toLowerCase())) return "Another column already has this name.";
    return null;
  };
  const validateWip = (value) => (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 999 ? null : "Enter a whole number from 1 to 999.");

  const lookup = (taskId) => tasks.find((task) => task.id === taskId);
  const columnTasks = (statusId) => board.find((column) => column.id === statusId).tasks;

  // move = { taskId, statusId, afterTaskId (null = first in the column) }
  const applyMove = async (move) => {
    const before = allTasks;
    // only the moved task gets a new object (and its new stage); the other cards keep theirs and skip re-rendering
    const moved = boardMove(allTasks, shownColumns, move).map((task) =>
      task.id === move.taskId ? { ...task, stage: taskStage(task.statusId, columns) } : task,
    );
    setOptimistic({ source: data, tasks: moved });
    try {
      await moveOnBoard(project.id, move.taskId, move);
    } catch (err) {
      setOptimistic({ source: data, tasks: before });
      setNotice({ severity: "error", text: errorMessage(err, "Couldn't move the task. Please try again.", TASK_ERROR_MESSAGES) });
    }
  };

  // what a drop landed on: { statusId, overTaskId } (overTaskId null = the column itself), or null
  const dropTarget = (over) => {
    const target = over?.data.current;
    if (!target) return null;
    if (target.column) return { statusId: target.statusId, overTaskId: null };
    const task = lookup(target.taskId);
    return task ? { statusId: task.statusId, overTaskId: task.id } : null;
  };

  const handleDragStart = ({ active }) => {
    const task = lookup(active.data.current.taskId);
    setDragging(task && { taskId: task.id, fromStatusId: task.statusId });
  };

  const handleDragOver = ({ over }) => setOverStatusId(dropTarget(over)?.statusId ?? null);

  const handleDragEnd = ({ active, over }) => {
    setDragging(null);
    setOverStatusId(null);
    const target = dropTarget(over);
    const task = lookup(active.data.current.taskId);
    if (!target || !task) return;

    const list = columnTasks(target.statusId);
    let afterTaskId;
    if (target.statusId === task.statusId) {
      if (target.overTaskId === null) return; // dropped on its own column's empty space
      const from = list.findIndex((t) => t.id === task.id);
      const to = list.findIndex((t) => t.id === target.overTaskId);
      if (from === to) return;
      afterTaskId = arrayMove(list, from, to)[to - 1]?.id ?? null;
    } else if (target.overTaskId !== null) {
      // into another column: before the card it was dropped on, or after it when dropped on its lower half
      const overIndex = list.findIndex((t) => t.id === target.overTaskId);
      afterTaskId = isBelow(active, over) ? target.overTaskId : (list[overIndex - 1]?.id ?? null);
    } else {
      afterTaskId = list.at(-1)?.id ?? null; // on the column itself: at its end
    }
    applyMove({ taskId: task.id, statusId: target.statusId, afterTaskId });
  };

  const handleDragCancel = () => {
    setDragging(null);
    setOverStatusId(null);
  };

  const draggedTask = dragging && lookup(dragging.taskId);

  const handleCompleted = ({ sprint: completed, carriedOver, toSprint }) => {
    setCompleting(false);
    const moved = carriedOver === 0 ? "" : ` ${carriedOver} unfinished ${carriedOver === 1 ? "task moved" : "tasks moved"} to ${toSprint ? toSprint.name : "the backlog"}.`;
    setNotice({ severity: "success", text: `${completed.name} is complete.${moved}` });
    reload();
  };

  return (
    <Box>
      {sprint && (
        <SprintBoardHeader
          sprint={sprint}
          tasks={tasks}
          columns={columns}
          canComplete={canComplete}
          onComplete={() => setCompleting(true)}
        />
      )}

      <TaskFilterBar
        filters={filters}
        onChange={onFiltersChange}
        members={members}
        columns={shownColumns}
        labels={projectLabels(allTasks)}
        match={match}
        shown={visible.length}
        total={tasks.length}
        // Kanban has no backlog page: new tasks start in the board's first column. The button (on the filter
        // row's right, like the Backlog's) opens the full window, the bar below adds one by title
        actions={
          !scrum &&
          canMove &&
          onCreateTask && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={onCreateTask}>
              Create task
            </Button>
          )
        }
      />

      {!scrum && canMove && (
        <Paper elevation={0} sx={{ mb: 2.5, border: 1, borderColor: "divider", borderRadius: 2, boxShadow: 1 }}>
          <QuickAddTask projectId={project.id} onCreated={reload} />
        </Paper>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {/* the columns keep their width and the board scrolls sideways when they don't fit */}
        <Box sx={{ display: "flex", alignItems: "stretch", gap: 2, overflowX: "auto", pb: 1 }}>
          {shownBoard.map((column, index) => (
            <BoardColumn
              key={column.id}
              column={column}
              total={board[index].tasks.length}
              highlight={Boolean(dragging) && overStatusId === column.id && dragging.fromStatusId !== column.id}
              emptyText={
                match.matches && board[index].tasks.length > 0
                  ? "No matching tasks"
                  : canMove
                    ? "Drop tasks here"
                    : "No tasks"
              }
              menu={
                  canEditColumns && (
                      <ColumnMenu
                          column={column}
                          kanban={!scrum}
                          canMoveLeft={index > 0}
                          canMoveRight={index < board.length - 1}
                          onRename={() => setColumnDialog({ type: "rename", columnId: column.id })}
                          onMoveLeft={() => moveColumn(column.id, -1)}
                          onMoveRight={() => moveColumn(column.id, 1)}
                          onEditWip={() => setColumnDialog({ type: "wip", columnId: column.id })}
                          onClearWip={() => setWip(column.id, null)}
                          onDelete={() => removeColumn(column.id)}
                      />
                  )
              }
            >
              {column.tasks.map((task) => (
                <BoardCard key={task.id} task={task} canDrag={canMove} onOpen={setOpenTaskId} />
              ))}
            </BoardColumn>
          ))}
        </Box>

        {/* the card that follows the pointer while dragging */}
        <DragOverlay dropAnimation={null}>{draggedTask && <BoardCardContent task={draggedTask} raised draggable />}</DragOverlay>
      </DndContext>

      {openTaskId !== null && (
        <TaskDrawer
          project={project}
          taskId={openTaskId}
          columns={columns}
          members={members}
          labels={projectLabels(allTasks)}
          canEdit={writable && can(project, PERMISSIONS.EDIT_TASKS)}
          onClose={() => setOpenTaskId(null)}
          onChanged={reload}
        />
      )}

      {completing && (
        <CompleteSprintDialog
          sprint={sprint}
          tasks={tasks}
          columns={columns}
          plannedSprints={data.sprints.filter((s) => s.status === "PLANNED")}
          onClose={() => setCompleting(false)}
          onCompleted={handleCompleted}
        />
      )}

      {dialogColumn && columnDialog.type === "rename" && (
          <ColumnFieldDialog
              title="Rename column"
              label="Column name"
              initialValue={dialogColumn.name}
              validate={validateName(dialogColumn.id)}
              onSubmit={(name) => renameColumn(dialogColumn.id, name)}
              onClose={() => setColumnDialog(null)}
          />
      )}
      {dialogColumn && columnDialog.type === "wip" && (
          <ColumnFieldDialog
              title="Work-in-progress limit"
              label="Max tasks in this column"
              type="number"
              initialValue={dialogColumn.wipLimit ?? ""}
              helperText="The column turns red when it holds more tasks than this."
              validate={validateWip}
              onSubmit={(limit) => setWip(dialogColumn.id, Number(limit))}
              onClose={() => setColumnDialog(null)}
          />
      )}
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
    </Box>
  );
};

export default BoardTab;

import { useEffect, useRef, useState } from "react";
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Alert, Box, Button, Paper, Snackbar, Typography } from "@mui/material";
import ViewColumnOutlinedIcon from "@mui/icons-material/ViewColumnOutlined";
import AddIcon from "@mui/icons-material/Add";
import LoadState from "../general/LoadState";
import QuickAddTask from "../tasks/QuickAddTask";
import TaskDrawer from "../tasks/TaskDrawer";
import OpenSubtasksDialog from "../tasks/OpenSubtasksDialog";
import NoWorkAccess from "../tasks/NoWorkAccess";
import TaskFilterBar from "../tasks/filters/TaskFilterBar";
import { collisionDetection, isBelow } from "../tasks/dnd";
import { loadWork } from "../tasks/loadWork";
import BoardColumn from "./BoardColumn";
import BoardCard, { BoardCardContent } from "./BoardCard";
import SprintBoardHeader from "./SprintBoardHeader";
import CompleteSprintDialog from "./CompleteSprintDialog";
import AddColumnButton from "./AddColumnButton";
import { useColumnConfig } from "./useColumnConfig";
import { moveOnBoard } from "../../api/tasksApi";
import { useAsync } from "../../hooks/useAsync";
import { useTaskFilterMatches } from "../../hooks/useTaskFilterMatches";
import { PERMISSIONS } from "../../constants/projects";
import { TASK_ERROR_MESSAGES } from "../../constants/tasks";
import { errorMessage } from "../../utils/apiError";
import { can } from "../../utils/project";
import { boardMove, groupByColumn, wipWarningText } from "../../utils/board";
import { needsSubtaskConfirmation, projectLabels, taskStage } from "../../utils/task";
import { EMPTY_TASK_FILTERS } from "../../utils/taskFilters";

// Scrum without an active sprint: nothing to work on yet, the sprint is started from the backlog.
// `onOpenSettings` (people who configure the board) links to the columns in Settings, which work without a sprint
const NoActiveSprint = ({ onOpenBacklog, onOpenSettings }) => (
  <Paper elevation={0} sx={{ p: { xs: 4, sm: 6 }, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 2 }}>
    <ViewColumnOutlinedIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
    <Typography variant="h6" sx={{ fontWeight: 700 }}>
      No active sprint
    </Typography>
    <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2.5, maxWidth: 480, mx: "auto" }}>
      The board shows the work of the running sprint. Plan a sprint in the backlog and start it to see its tasks here.
    </Typography>
    <Box sx={{ display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap" }}>
      <Button variant="contained" onClick={onOpenBacklog}>
        Go to backlog
      </Button>
      {onOpenSettings && (
        <Button variant="outlined" onClick={onOpenSettings}>
          Configure columns
        </Button>
      )}
    </Box>
  </Paper>
);

// The Board tab. Scrum (R15): the active sprint's tasks by column, with its progress and Complete sprint.
// Kanban (R16): every task by column, with the work-in-progress limits (soft: a move past one still happens,
// the column turns red and a warning shows). Anyone with EDIT_TASKS drags cards across and within columns.
// People with CONFIGURE_BOARD (Project Manager, workspace admin) configure the columns from their menus
// (useColumnConfig: add, edit, move, WIP limit, delete), each saved by the backend, then the board reloads.
// `writable` is false in an archived project or workspace, which makes everything read-only.
// `taskVersion` goes up when a task is created outside the tab (the page's Create task window);
// `onCreateTask` opens that window, for the Kanban board's button on top (its quick bar stays).
// `filters` come from the filter bar (shared with the Backlog): the backend says which tasks match, the board shows
// only those, while the counts, WIP limits, sprint progress and drop positions keep using every task.
// `onOpenSettings` opens the Settings tab, whose "Board columns" section also works without an active sprint.
const BoardTab = ({
  project,
  writable,
  taskVersion = 0,
  onCreateTask,
  filters,
  onFiltersChange,
  onOpenBacklog,
  onOpenSettings,
}) => {
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
  const [confirmMove, setConfirmMove] = useState(null); // { move, before }: a move into Done waiting for a yes
  const sensors = useSensors(
    // a short move before dragging starts, so clicks on a card still open it
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // Enter opens a card, so only Space picks it up
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] },
    }),
  );

  const data = boardState.data;
  const scrum = project.template === "SCRUM";
  // every task of the project (a Scrum board shows only the sprint's), with the moves made since the last load
  const allTasks = !data ? [] : optimistic.source === data && optimistic.tasks ? optimistic.tasks : data.tasks;
  // a change can change what matches too
  const reload = () => {
    reloadBoard();
    reloadMatches();
  };
  // configuring the columns (R16), shared with the project's Settings (useColumnConfig)
  const columnConfig = useColumnConfig({
    projectId: project.id,
    columns: data?.columns ?? [],
    kanban: !scrum,
    wipEnabled: Boolean(data?.board.wipLimitsEnabled),
    // what a deleted column's tasks need a new place for. The loaded list follows each drag at once, the board's
    // `taskCount` is from the last load; the larger one is never too few. Subtasks only come as a count
    contentsOf: (column) => ({
      tasks: Math.max(allTasks.filter((task) => task.statusId === column.id).length, column.taskCount ?? 0),
      subtasks: column.subtaskCount ?? 0,
    }),
    onChanged: reload,
    onNotice: setNotice,
  });

  if (!canView) return <NoWorkAccess />;

  if (!data) {
    return (
      <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
        <LoadState loading={!boardState.error} error={boardState.error} onRetry={boardState.reload} rows={6} />
      </Paper>
    );
  }

  // configuring the columns: the backend checks every rule again, `columnRules` only hides what it would refuse
  const canConfigure = writable && can(project, PERMISSIONS.CONFIGURE_BOARD);
  const sprint = scrum ? data.sprints.find((s) => s.status === "ACTIVE") : null;
  if (scrum && !sprint) {
    return <NoActiveSprint onOpenBacklog={onOpenBacklog} onOpenSettings={canConfigure ? onOpenSettings : null} />;
  }

  const { columns, members } = data;
  // a Scrum board holds only the active sprint's tasks, a Kanban board all of them
  const inSprint = sprint && new Set(sprint.taskIds);
  const tasks = inSprint ? allTasks.filter((task) => inSprint.has(task.id)) : allTasks;
  // `board` has every task (drop positions, counts); `shownBoard` only the ones the filters keep
  const board = groupByColumn(columns, tasks);
  const visible = match.matches ? tasks.filter((task) => match.matches.has(task.id)) : tasks;
  const shownBoard = match.matches ? groupByColumn(columns, visible) : board;
  const canMove = writable && can(project, PERMISSIONS.EDIT_TASKS);
  const canComplete = writable && can(project, PERMISSIONS.MANAGE_SPRINTS);
  const wipEnabled = Boolean(data.board.wipLimitsEnabled);

  const lookup = (taskId) => tasks.find((task) => task.id === taskId);
  const columnTasks = (statusId) => board.find((column) => column.id === statusId).tasks;

  // a WIP limit never blocks a move: a saved task with a `wipWarning` moved into a column that is now over its limit
  const warnOverWip = (saved) => {
    const text = wipWarningText(saved?.wipWarning, columns);
    if (text) setNotice({ severity: "warning", text });
  };

  // sends a move that already shows; `before` is the task list to go back to if it's refused. A parent going into
  // Done with open subtasks stays where it was dropped while the user confirms (confirmMove)
  const sendMove = async (move, before) => {
    try {
      warnOverWip(await moveOnBoard(project.id, move.taskId, move));
    } catch (err) {
      if (!move.confirmOpenSubtasks && needsSubtaskConfirmation(err)) {
        setConfirmMove({ move, before });
        return;
      }
      setOptimistic({ source: data, tasks: before });
      setNotice({ severity: "error", text: errorMessage(err, "Couldn't move the task. Please try again.", TASK_ERROR_MESSAGES) });
    }
  };

  // move = { taskId, statusId, afterTaskId (null = first in the column) }
  const applyMove = (move) => {
    const before = allTasks;
    // only the moved task gets a new object (and its new stage); the other cards keep theirs and skip re-rendering
    const moved = boardMove(allTasks, columns, move).map((task) =>
      task.id === move.taskId ? { ...task, stage: taskStage(task.statusId, columns) } : task,
    );
    setOptimistic({ source: data, tasks: moved });
    sendMove(move, before);
  };

  const moveAnyway = () => {
    const { move, before } = confirmMove;
    setConfirmMove(null);
    sendMove({ ...move, confirmOpenSubtasks: true }, before);
  };

  const cancelMove = () => {
    setOptimistic({ source: data, tasks: confirmMove.before });
    setConfirmMove(null);
  };
  const confirmTask = confirmMove && allTasks.find((task) => task.id === confirmMove.move.taskId);

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
        columns={columns}
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
              showWip={wipEnabled}
              highlight={Boolean(dragging) && overStatusId === column.id && dragging.fromStatusId !== column.id}
              emptyText={
                match.matches && board[index].tasks.length > 0
                  ? "No matching tasks"
                  : canMove
                    ? "Drop tasks here"
                    : "No tasks"
              }
              // the unfiltered column: a filter can hide its tasks, not change what it holds
              menu={canConfigure && columnConfig.menu(board[index])}
            >
              {column.tasks.map((task) => (
                <BoardCard key={task.id} task={task} canDrag={canMove} onOpen={setOpenTaskId} />
              ))}
            </BoardColumn>
          ))}
          {canConfigure && <AddColumnButton full={columnConfig.full} onClick={columnConfig.add} />}
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
          onChanged={(saved) => {
            reload();
            warnOverWip(saved);
          }}
        />
      )}

      {confirmTask && (
        <OpenSubtasksDialog
          task={confirmTask}
          columnName={columns.find((column) => column.id === confirmMove.move.statusId)?.name}
          onConfirm={moveAnyway}
          onClose={cancelMove}
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

      {columnConfig.dialogs}
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

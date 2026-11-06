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
import ColumnMenu from "./ColumnMenu";
import ColumnFieldDialog from "./ColumnFieldDialog";
import ColumnDialog from "./ColumnDialog";
import DeleteColumnDialog from "./DeleteColumnDialog";
import AddColumnButton from "./AddColumnButton";
import { moveOnBoard } from "../../api/tasksApi";
import { reorderBoardColumns, updateBoardColumn } from "../../api/projectsApi";
import { useAsync } from "../../hooks/useAsync";
import { useTaskFilterMatches } from "../../hooks/useTaskFilterMatches";
import { PERMISSIONS } from "../../constants/projects";
import { COLUMN_ERROR_MESSAGES, TASK_ERROR_MESSAGES } from "../../constants/tasks";
import { errorMessage } from "../../utils/apiError";
import { can } from "../../utils/project";
import { boardMove, columnRules, groupByColumn, MAX_COLUMNS, moveColumnId, wipWarningText } from "../../utils/board";
import { needsSubtaskConfirmation, projectLabels, taskStage } from "../../utils/task";
import { EMPTY_TASK_FILTERS } from "../../utils/taskFilters";
import { validateWipLimit } from "../../utils/validation";

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
// Kanban (R16): every task by column, with the work-in-progress limits (soft: a move past one still happens,
// the column turns red and a warning shows). Anyone with EDIT_TASKS drags cards across and within columns.
// People with CONFIGURE_BOARD (Project Manager, workspace admin) configure the columns: add, edit (name, category),
// move, WIP limit and delete, each saved by the backend (board-docs.md), then the board reloads.
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
  const [columnDialog, setColumnDialog] = useState(null); // { type: "add" | "edit" | "wip" | "delete", columnId }
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
  // `board` has every task (drop positions, counts); `shownBoard` only the ones the filters keep
  const board = groupByColumn(columns, tasks);
  const visible = match.matches ? tasks.filter((task) => match.matches.has(task.id)) : tasks;
  const shownBoard = match.matches ? groupByColumn(columns, visible) : board;
  const canMove = writable && can(project, PERMISSIONS.EDIT_TASKS);
  const canComplete = writable && can(project, PERMISSIONS.MANAGE_SPRINTS);
  // a change can change what matches too
  const reload = () => {
    reloadBoard();
    reloadMatches();
  };

  // configuring the columns (R16): the backend checks every rule again, `columnRules` only hides what it would refuse
  const canConfigure = writable && can(project, PERMISSIONS.CONFIGURE_BOARD);
  const wipEnabled = Boolean(data.board.wipLimitsEnabled);
  const rulesFor = (columnId) => columnRules(columns, columnId, { kanban: !scrum, wipEnabled });
  const dialogColumn = columnDialog?.columnId != null ? board.find((column) => column.id === columnDialog.columnId) : null;
  // every task in a column, not only the ones on screen (a Scrum board shows only the sprint's). From the loaded task
  // list, which follows each drag at once; the board's `taskCount` is from the last load and goes stale after a move
  const columnTaskCount = (columnId) => allTasks.filter((task) => task.statusId === columnId).length;
  const closeColumnDialog = () => setColumnDialog(null);
  const columnSaved = () => {
    setColumnDialog(null);
    reload();
  };
  // the menu's one-click changes (move, remove the limit): saved, then the board reloads; a refusal shows its reason
  const changeColumns = async (action, fallback) => {
    try {
      await action();
      reload();
    } catch (err) {
      setNotice({ severity: "error", text: errorMessage(err, fallback, COLUMN_ERROR_MESSAGES) });
    }
  };
  const moveColumn = (id, step) =>
    changeColumns(() => reorderBoardColumns(project.id, moveColumnId(columns, id, step)), "Couldn't move the column. Please try again.");
  const clearWip = (id) =>
    changeColumns(() => updateBoardColumn(project.id, id, { clearWipLimit: true }), "Couldn't remove the limit. Please try again.");
  const columnDeleted = (target) => {
    const count = dialogColumn ? columnTaskCount(dialogColumn.id) : 0;
    const moved = target ? ` Its ${count === 1 ? "task" : `${count} tasks`} moved to ${target.name}.` : "";
    setNotice({ severity: "success", text: `Column deleted.${moved}` });
    columnSaved();
  };

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
              menu={
                canConfigure && (
                  <ColumnMenu
                    // the unfiltered column: a filter can hide its tasks, not change what it holds
                    column={board[index]}
                    rules={rulesFor(column.id)}
                    onEdit={() => setColumnDialog({ type: "edit", columnId: column.id })}
                    onMoveLeft={() => moveColumn(column.id, -1)}
                    onMoveRight={() => moveColumn(column.id, 1)}
                    onEditWip={() => setColumnDialog({ type: "wip", columnId: column.id })}
                    onClearWip={() => clearWip(column.id)}
                    onDelete={() => setColumnDialog({ type: "delete", columnId: column.id })}
                  />
                )
              }
            >
              {column.tasks.map((task) => (
                <BoardCard key={task.id} task={task} canDrag={canMove} onOpen={setOpenTaskId} />
              ))}
            </BoardColumn>
          ))}
          {canConfigure && (
            <AddColumnButton full={columns.length >= MAX_COLUMNS} onClick={() => setColumnDialog({ type: "add", columnId: null })} />
          )}
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

      {columnDialog?.type === "add" && (
        <ColumnDialog projectId={project.id} columns={columns} onSaved={columnSaved} onClose={closeColumnDialog} />
      )}
      {dialogColumn && columnDialog.type === "edit" && (
        <ColumnDialog
          projectId={project.id}
          column={dialogColumn}
          columns={columns}
          rules={rulesFor(dialogColumn.id)}
          onSaved={columnSaved}
          onClose={closeColumnDialog}
        />
      )}
      {dialogColumn && columnDialog.type === "wip" && (
        <ColumnFieldDialog
          title={`WIP limit for ${dialogColumn.name}`}
          label="Max tasks in this column"
          type="number"
          initialValue={dialogColumn.wipLimit ?? ""}
          helperText="Moves past it still work; the column turns red while it holds more tasks than this."
          validate={validateWipLimit}
          onSubmit={async (limit) => {
            await updateBoardColumn(project.id, dialogColumn.id, { wipLimit: Number(limit) });
            reload();
          }}
          onClose={closeColumnDialog}
        />
      )}
      {dialogColumn && columnDialog.type === "delete" && (
        <DeleteColumnDialog
          projectId={project.id}
          column={dialogColumn}
          columns={columns}
          count={columnTaskCount(dialogColumn.id)}
          onDeleted={columnDeleted}
          onClose={closeColumnDialog}
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

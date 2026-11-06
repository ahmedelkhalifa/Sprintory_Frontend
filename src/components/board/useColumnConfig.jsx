import { useState } from "react";
import ColumnMenu from "./ColumnMenu";
import ColumnDialog from "./ColumnDialog";
import ColumnFieldDialog from "./ColumnFieldDialog";
import DeleteColumnDialog from "./DeleteColumnDialog";
import { reorderBoardColumns, updateBoardColumn } from "../../api/projectsApi";
import { COLUMN_ERROR_MESSAGES } from "../../constants/tasks";
import { errorMessage } from "../../utils/apiError";
import { columnContentsLabel, columnRules, MAX_COLUMNS, moveColumnId } from "../../utils/board";
import { validateWipLimit } from "../../utils/validation";

/**
 * Configuring a board's columns (R16, backend docs/board-docs.md), shared by the Board tab and the "Board columns"
 * section of the project's Settings: add, edit (name, category), move, WIP limit and delete. Every change is saved
 * by the backend, which checks every rule again; `columnRules` only hides what it would refuse.
 * const config = useColumnConfig({ projectId, columns, kanban, wipEnabled, contentsOf, onChanged, onNotice });
 * `config.menu(column)` is a column's "⋯" menu, `config.add()` opens Add column, `config.full` says the board has
 * MAX_COLUMNS, and `config.dialogs` has to be rendered once. `contentsOf(column)` = { tasks, subtasks } it holds (for
 * the delete), `onChanged()` reloads after a change, also after a refused one (someone else may have changed the
 * board), and `onNotice({ severity, text })` shows the outcome.
 */
export const useColumnConfig = ({ projectId, columns, kanban, wipEnabled, contentsOf, onChanged, onNotice }) => {
  const [dialog, setDialog] = useState(null); // { type: "add" | "edit" | "wip" | "delete", columnId }
  const rulesFor = (columnId) => columnRules(columns, columnId, { kanban, wipEnabled });
  const column = dialog?.columnId != null ? columns.find((c) => c.id === dialog.columnId) : null;

  const close = () => setDialog(null);
  const saved = () => {
    setDialog(null);
    onChanged();
  };

  // the menu's one-click changes (move, remove the limit)
  const change = async (action, fallback) => {
    try {
      await action();
    } catch (err) {
      onNotice({ severity: "error", text: errorMessage(err, fallback, COLUMN_ERROR_MESSAGES) });
    }
    onChanged();
  };
  const move = (id, step) =>
    change(() => reorderBoardColumns(projectId, moveColumnId(columns, id, step)), "Couldn't move the column. Please try again.");
  const clearWip = (id) =>
    change(() => updateBoardColumn(projectId, id, { clearWipLimit: true }), "Couldn't remove the limit. Please try again.");

  const deleted = (target) => {
    const what = target && column ? columnContentsLabel(contentsOf(column)) : "";
    onNotice({ severity: "success", text: `Column deleted.${what ? ` Its ${what} moved to ${target.name}.` : ""}` });
    saved();
  };

  const menu = (shown) => (
    <ColumnMenu
      column={shown}
      rules={rulesFor(shown.id)}
      onEdit={() => setDialog({ type: "edit", columnId: shown.id })}
      onMoveLeft={() => move(shown.id, -1)}
      onMoveRight={() => move(shown.id, 1)}
      onEditWip={() => setDialog({ type: "wip", columnId: shown.id })}
      onClearWip={() => clearWip(shown.id)}
      onDelete={() => setDialog({ type: "delete", columnId: shown.id })}
    />
  );

  const dialogs = (
    <>
      {dialog?.type === "add" && <ColumnDialog projectId={projectId} columns={columns} onSaved={saved} onClose={close} />}
      {column && dialog.type === "edit" && (
        <ColumnDialog
          projectId={projectId}
          column={column}
          columns={columns}
          rules={rulesFor(column.id)}
          onSaved={saved}
          onClose={close}
        />
      )}
      {column && dialog.type === "wip" && (
        <ColumnFieldDialog
          title={`WIP limit for ${column.name}`}
          label="Max tasks in this column"
          type="number"
          initialValue={column.wipLimit ?? ""}
          helperText="Moves past it still work; the column turns red while it holds more tasks than this."
          validate={validateWipLimit}
          onSubmit={async (limit) => {
            await updateBoardColumn(projectId, column.id, { wipLimit: Number(limit) });
            onChanged();
          }}
          onClose={close}
        />
      )}
      {column && dialog.type === "delete" && (
        <DeleteColumnDialog
          projectId={projectId}
          column={column}
          columns={columns}
          contents={contentsOf(column)}
          onDeleted={deleted}
          onClose={close}
        />
      )}
    </>
  );

  return { menu, add: () => setDialog({ type: "add", columnId: null }), full: columns.length >= MAX_COLUMNS, dialogs };
};

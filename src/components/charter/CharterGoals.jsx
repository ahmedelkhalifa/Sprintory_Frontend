import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, Button, Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import SectionCard from "../general/SectionCard";
import ConfirmDialog from "../general/ConfirmDialog";
import GoalDialog from "./GoalDialog";
import { deleteCharterGoal } from "../../api/charterApi";
import { useSubmit } from "../../hooks/useSubmit";
import { CHARTER_ERROR_MESSAGES } from "../../constants/charter";

const dragId = (goal) => `goal-${goal.id}`;

// one goal's actions: edit, move up / down (the keyboard-free way to reorder), delete
const GoalMenu = ({ goal, index, count, onEdit, onMove, onDelete }) => {
  const [anchor, setAnchor] = useState(null);
  const run = (action) => () => {
    setAnchor(null);
    action();
  };
  return (
    <>
      <IconButton size="small" aria-label={`Actions for ${goal.title}`} onClick={(e) => setAnchor(e.currentTarget)}>
        <MoreVertRoundedIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={run(onEdit)}>
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem onClick={run(() => onMove(index, index - 1))} disabled={index === 0}>
          <ListItemIcon>
            <ArrowUpwardRoundedIcon fontSize="small" />
          </ListItemIcon>
          Move up
        </MenuItem>
        <MenuItem onClick={run(() => onMove(index, index + 1))} disabled={index === count - 1}>
          <ListItemIcon>
            <ArrowDownwardRoundedIcon fontSize="small" />
          </ListItemIcon>
          Move down
        </MenuItem>
        <Divider />
        <MenuItem onClick={run(onDelete)} sx={{ color: "error.main" }}>
          <ListItemIcon sx={{ color: "inherit" }}>
            <DeleteOutlineRoundedIcon fontSize="small" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
    </>
  );
};

const GoalRow = ({ goal, index, count, editable, busy, onEdit, onMove, onDelete }) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: dragId(goal),
    disabled: !editable || busy,
  });

  return (
    <Box
      component="li"
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      sx={{
        position: "relative",
        bgcolor: "background.paper",
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1 : "auto",
        "& + li": { borderTop: 1, borderColor: "divider" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, px: { xs: 2, sm: 3 }, py: 1.5 }}>
        {editable && (
          <Tooltip title="Drag to reorder">
            <IconButton
              size="small"
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              aria-label={`Reorder ${goal.title}`}
              disabled={busy}
              sx={{ cursor: "grab", touchAction: "none", mt: -0.25, ml: -1 }}
            >
              <DragIndicatorRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Box
          aria-hidden
          sx={{
            width: 24,
            height: 24,
            flexShrink: 0,
            borderRadius: "50%",
            bgcolor: "navActive.background",
            color: "navActive.text",
            fontSize: 12,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {index + 1}
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, wordBreak: "break-word" }}>{goal.title}</Typography>
          {goal.successMeasure ? (
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75, mt: 0.5, color: "text.secondary" }}>
              <FlagOutlinedIcon sx={{ fontSize: 16, mt: "2px" }} aria-hidden />
              <Typography variant="body2" sx={{ wordBreak: "break-word", whiteSpace: "pre-line" }}>
                <Box component="span" sx={{ fontWeight: 600 }}>
                  Success measure:
                </Box>{" "}
                {goal.successMeasure}
              </Typography>
            </Box>
          ) : null}
        </Box>
        {editable && (
          <GoalMenu goal={goal} index={index} count={count} onEdit={onEdit} onMove={onMove} onDelete={onDelete} />
        )}
      </Box>
    </Box>
  );
};

// The charter's goals in their manual order. With `editable`: add, edit, delete, and reorder by dragging (mouse,
// touch or keyboard: space, arrows, space) or with Move up / down. `onReorder(from, to)` is applied optimistically
// by CharterTab; `reordering` is true while it's being saved.
const CharterGoals = ({ project, goals, editable, reordering, onReorder, onChanged, onNotice }) => {
  const [dialog, setDialog] = useState(null); // { type: "add" | "edit" | "delete", goal? }
  const remove = useSubmit(CHARTER_ERROR_MESSAGES);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const close = () => {
    setDialog(null);
    remove.clearError();
  };

  const saved = (text) => {
    setDialog(null);
    onNotice(text);
    onChanged();
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = goals.findIndex((goal) => dragId(goal) === active.id);
    const to = goals.findIndex((goal) => dragId(goal) === over.id);
    if (from >= 0 && to >= 0) onReorder(from, to);
  };

  const confirmDelete = async () => {
    const { ok } = await remove.run(() => deleteCharterGoal(project.id, dialog.goal.id));
    if (ok) saved("Goal deleted.");
  };

  return (
    <SectionCard
      title="Goals"
      count={goals.length}
      toolbar={
        editable && (
          <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => setDialog({ type: "add" })}>
            Add goal
          </Button>
        )
      }
    >
      {goals.length === 0 ? (
        <Box sx={{ p: { xs: 3, sm: 4 }, textAlign: "center" }}>
          <Typography color="text.secondary">No goals yet.</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {editable
              ? "Write down what the project should achieve, each with a way to measure success."
              : "The project's goals will appear here once they're written down."}
          </Typography>
        </Box>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={goals.map(dragId)} strategy={verticalListSortingStrategy}>
            <Box component="ol" aria-label="Goals" aria-busy={reordering || undefined} sx={{ listStyle: "none", m: 0, p: 0 }}>
              {goals.map((goal, index) => (
                <GoalRow
                  key={goal.id}
                  goal={goal}
                  index={index}
                  count={goals.length}
                  editable={editable}
                  busy={reordering}
                  onEdit={() => setDialog({ type: "edit", goal })}
                  onMove={onReorder}
                  onDelete={() => setDialog({ type: "delete", goal })}
                />
              ))}
            </Box>
          </SortableContext>
        </DndContext>
      )}

      {(dialog?.type === "add" || dialog?.type === "edit") && (
        <GoalDialog
          projectId={project.id}
          goal={dialog.goal ?? null}
          onClose={close}
          onSaved={() => saved(dialog.type === "add" ? "Goal added." : "Goal saved.")}
        />
      )}
      {dialog?.type === "delete" && (
        <ConfirmDialog
          tone="danger"
          title="Delete goal?"
          message={`“${dialog.goal.title}” will be removed from the charter. The charter history keeps a record of it.`}
          confirmLabel="Delete"
          loading={remove.submitting}
          error={remove.error}
          onConfirm={confirmDelete}
          onClose={close}
        />
      )}
    </SectionCard>
  );
};

export default CharterGoals;

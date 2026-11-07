import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Link, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SubdirectoryArrowRightRoundedIcon from "@mui/icons-material/SubdirectoryArrowRightRounded";
import FormField from "../../forms/FormField";
import AssigneePicker from "../AssigneePicker";
import DetailRow from "../DetailRow";
import TaskActivity from "../TaskActivity";
import TaskBreadcrumbs from "../TaskBreadcrumbs";
import TaskDates from "../TaskDates";
import TaskDeleteAction from "../TaskDeleteAction";
import TaskDescription from "../TaskDescription";
import TaskStatusSelect from "../TaskStatusSelect";
import TaskTitleField from "../TaskTitleField";
import { updateSubtask } from "../../../api/tasksApi";
import { useFieldSave } from "../../../hooks/useFieldSave";
import { findAssignee, formatMinutes, subtaskChanges, subtaskValues, taskPath } from "../../../utils/task";
import { validateSubtask } from "../../../utils/validation";

// A subtask's own page, opened from its parent's list (like a Jira child issue): only what a subtask has, i.e. its
// title, description, status, assignee and time estimate in minutes, each saved on its own (useFieldSave) with the
// subtask endpoint (the task PATCH would read `estimate` as story points), and its own comments and history.
// No type, priority, labels or subtasks (one level only). `parent` is its parent task, for the way back; deleting the subtask goes there too.
const SubtaskView = ({ workspace, project, initialTask, parent, columns, members, canEdit }) => {
  const navigate = useNavigate();
  const [task, setTask] = useState(initialTask);
  const [minutes, setMinutes] = useState(null); // the typed time, until it's saved
  const [people, setPeople] = useState(members);
  const fields = useFieldSave(task, {
    toValues: subtaskValues,
    validate: validateSubtask,
    toChanges: subtaskChanges,
    send: (changes) => updateSubtask(project.id, parent.id, task.id, changes),
    onSaved: setTask,
  });
  const locked = !canEdit || fields.submitting;
  const parentPath = taskPath(workspace, project, parent.id);
  const { errors } = fields;

  const saveMinutes = async () => {
    if (minutes === null) return;
    const { ok, invalid } = await fields.save({ estimateMinutes: minutes.trim() });
    // keep an invalid value to fix; after a refusal show the subtask's time again
    if (ok || !invalid) setMinutes(null);
  };

  const saveAssignee = (member) => {
    if (member && !people.some((person) => person.userId === member.userId)) setPeople((prev) => [...prev, member]);
    fields.save({ assigneeId: member?.userId ?? null });
  };

  return (
    <Box>
      <TaskBreadcrumbs workspace={workspace} project={project} parent={parent} task={task} sx={{ mb: 1.5 }} />

      {fields.error && (
        <Alert severity="error" onClose={fields.clearError} sx={{ mb: 2 }}>
          {fields.error}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) 380px" },
          gap: 4,
          alignItems: "start",
        }}
      >
        {/* left: where it belongs, the title, the description and the activity */}
        <Box>
          <Link
            component={RouterLink}
            to={parentPath}
            underline="hover"
            color="text.secondary"
            sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mb: 1, fontSize: 14, maxWidth: "100%" }}
          >
            <SubdirectoryArrowRightRoundedIcon fontSize="small" sx={{ transform: "scaleY(-1)" }} />
            <Box component="span" sx={{ flexShrink: 0 }}>
              Subtask of {parent.key}
            </Box>
            <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              · {parent.title}
            </Box>
          </Link>
          <TaskTitleField
            title={task.title}
            canEdit={canEdit}
            error={errors.title}
            onEdit={() => fields.clearFieldError("title")}
            onSave={(title) => fields.save({ title })}
          />
          <Typography sx={{ fontWeight: 600, mt: 4, mb: 1 }}>Description</Typography>
          <TaskDescription
            description={task.description}
            projectId={project.id}
            canEdit={canEdit}
            saving={fields.submitting}
            error={errors.description}
            onEdit={() => fields.clearFieldError("description")}
            onSave={(description) => fields.save({ description })}
          />
          <TaskActivity project={project} task={task} members={people} />
        </Box>

        {/* right: the status, the details and the dates */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <TaskStatusSelect
              value={task.statusId}
              columns={columns}
              canEdit={canEdit}
              disabled={locked}
              onChange={(statusId) => fields.save({ statusId })}
            />
            <Box sx={{ flexGrow: 1 }} />
            {canEdit && (
              <TaskDeleteAction
                projectId={project.id}
                task={task}
                onDeleted={() => navigate(parentPath, { replace: true })}
              />
            )}
          </Box>

          <Accordion
            defaultExpanded
            disableGutters
            elevation={0}
            sx={{ border: 1, borderColor: "divider", borderRadius: 2, "&:before": { display: "none" } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600 }}>Details</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <DetailRow id="subtask-assignee" label="Assignee">
                <AssigneePicker
                  id="subtask-assignee"
                  label={null}
                  projectId={project.id}
                  value={findAssignee(task.assigneeId, people)}
                  onChange={saveAssignee}
                  disabled={locked}
                />
              </DetailRow>
              <DetailRow id="subtask-time" label="Time (min)">
                <FormField
                  id="subtask-time"
                  type="number"
                  value={minutes ?? String(task.estimateMinutes ?? "")}
                  disabled={locked}
                  placeholder={canEdit ? "e.g. 90" : "None"}
                  error={Boolean(errors.estimateMinutes)}
                  helperText={errors.estimateMinutes || formatMinutes(minutes ?? task.estimateMinutes)}
                  onChange={(e) => {
                    setMinutes(e.target.value);
                    fields.clearFieldError("estimateMinutes");
                  }}
                  onBlur={saveMinutes}
                  onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                  slotProps={{ htmlInput: { min: 1, step: 1 } }}
                />
              </DetailRow>
            </AccordionDetails>
          </Accordion>

          <TaskDates task={task} />
        </Box>
      </Box>
    </Box>
  );
};

export default SubtaskView;

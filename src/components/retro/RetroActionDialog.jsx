import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
} from "@mui/material";
import FormField from "../forms/FormField";
import AssigneePicker from "../tasks/AssigneePicker";
import { listSprints } from "../../api/sprintsApi";
import { useAsync } from "../../hooks/useAsync";
import { useSubmit } from "../../hooks/useSubmit";
import { RETRO_DESTINATION, RETRO_ERROR_MESSAGES } from "../../constants/retro";
import { SPRINT_STATUS } from "../../constants/tasks";
import { errorCode } from "../../utils/apiError";
import { formatDate } from "../../utils/format";
import { actionTitle, EMPTY_RETRO_ACTION, retroActionRequest, validateRetroAction } from "../../utils/retro";
import { TASK_TITLE_MAX } from "../../utils/validation";

const { BACKLOG, SPRINT } = RETRO_DESTINATION;

const legendSx = { mb: 0.5, fontSize: 14, fontWeight: 500, color: "text.primary", "&.Mui-focused": { color: "text.primary" } };

// The "Create action" window (managers): a title, an owner and where the new task goes, the backlog or a planned
// sprint. `item` is the card it's made from (its text becomes the title) or null. `onCreate(body)` creates it and
// throws what the backend refused; the window then keeps what was typed. `retro` is the live one: closed meanwhile
// means nothing can be created anymore, a deleted card only that the action loses its card.
const RetroActionDialog = ({ open = true, retro, item, project, onCreate, onCreated, onClose }) => {
  const [values, setValues] = useState(() => ({
    ...EMPTY_RETRO_ACTION,
    title: item ? actionTitle(item.body, item.mentions) : "",
  }));
  const [errors, setErrors] = useState({});
  const submit = useSubmit(RETRO_ERROR_MESSAGES);
  // a second Enter would make a second task, also while the window closes after the first. A ref, because state only
  // changes with the next draw
  const sending = useRef(false);
  const sprints = useAsync((signal) => listSprints(project.id, signal), [project.id], {
    fallback: "Couldn't load the planned sprints.",
  });

  const locked = !retro.canManage;
  const cardGone = Boolean(item) && !retro.items.some((other) => other.id === item.id);
  const planned = (sprints.data ?? []).filter((sprint) => sprint.status === SPRINT_STATUS.PLANNED.value);
  // a sprint that isn't planned anymore can't stay chosen; the only one is chosen right away
  const sprintId = planned.some((sprint) => sprint.id === values.sprintId)
    ? values.sprintId
    : planned.length === 1
      ? planned[0].id
      : "";
  const destination = planned.length > 0 ? values.destination : BACKLOG;

  const set = (field, value, errorField = field) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [errorField]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending.current || locked) return;
    const chosen = { ...values, destination, sprintId };
    const found = validateRetroAction(chosen);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    sending.current = true;
    const { ok, result, error } = await submit.run(() => onCreate(retroActionRequest(chosen, cardGone ? null : item?.id)));
    if (ok) {
      onCreated(result);
      return;
    }
    sending.current = false;
    const code = errorCode(error);
    if (code === "VALIDATION_ERROR" && error.response.data.fieldErrors) {
      setErrors(error.response.data.fieldErrors);
      submit.clearError();
    } else if (code === "BAD_REQUEST" || code === "RESOURCE_NOT_FOUND") {
      // the sprint may have started or gone meanwhile
      sprints.reload();
    }
  };

  return (
    <Dialog open={open} onClose={submit.submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" noValidate onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>Create action</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            <FormField
              id="retro-action-title"
              label="Title"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="What will the team do?"
              autoFocus
              error={Boolean(errors.title)}
              helperText={errors.title}
              slotProps={{ htmlInput: { maxLength: TASK_TITLE_MAX } }}
            />
            <AssigneePicker
              id="retro-action-owner"
              label="Owner"
              placeholder="Choose a person"
              projectId={project.id}
              value={values.owner}
              onChange={(member) => set("owner", member, "ownerId")}
              error={errors.ownerId}
            />
            <FormControl error={Boolean(errors.sprintId)}>
              <FormLabel id="retro-action-destination" sx={legendSx}>
                The task goes to
              </FormLabel>
              <RadioGroup
                aria-labelledby="retro-action-destination"
                value={destination}
                onChange={(e) => set("destination", e.target.value, "sprintId")}
              >
                <FormControlLabel value={BACKLOG} control={<Radio size="small" />} label="Backlog" />
                {planned.length > 0 && (
                  <FormControlLabel
                    value={SPRINT}
                    control={<Radio size="small" />}
                    label={planned.length === 1 ? `Planned sprint (${planned[0].name})` : "A planned sprint"}
                    sx={{ overflowWrap: "anywhere" }}
                  />
                )}
              </RadioGroup>
              {destination === SPRINT && planned.length > 1 && (
                <FormField
                  id="retro-action-sprint"
                  select
                  value={sprintId}
                  onChange={(e) => set("sprintId", e.target.value)}
                  error={Boolean(errors.sprintId)}
                  helperText={errors.sprintId}
                  slotProps={{
                    htmlInput: { "aria-label": "Planned sprint" },
                    select: { displayEmpty: true },
                  }}
                  sx={{ mt: 0.5, pl: 3.5, width: "auto" }}
                >
                  <MenuItem value="" disabled>
                    Choose a sprint
                  </MenuItem>
                  {planned.map((sprint) => (
                    <MenuItem key={sprint.id} value={sprint.id}>
                      {sprint.name}
                      {sprint.startDate ? ` · starts ${formatDate(sprint.startDate)}` : ""}
                    </MenuItem>
                  ))}
                </FormField>
              )}
              {sprints.data && planned.length === 0 && <FormHelperText sx={{ mx: 0 }}>There are no planned sprints.</FormHelperText>}
              {sprints.error && (
                <Alert
                  severity="warning"
                  sx={{ mt: 1 }}
                  action={
                    <Button color="inherit" size="small" onClick={sprints.reload}>
                      Try again
                    </Button>
                  }
                >
                  {`${sprints.error} The backlog still works.`}
                </Alert>
              )}
            </FormControl>
            {submit.error && <Alert severity="error">{submit.error}</Alert>}
            {cardGone && !locked && (
              <Alert severity="info">The card was deleted. You can still create the action without it.</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={submit.submitting} color="inherit">
            {locked ? "Close" : "Cancel"}
          </Button>
          {!locked && (
            <Button type="submit" variant="contained" loading={submit.submitting}>
              Create action
            </Button>
          )}
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default RetroActionDialog;

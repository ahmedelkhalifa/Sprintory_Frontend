import { useState } from "react";
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
  Typography,
} from "@mui/material";
import FormField from "../forms/FormField";
import LoadState from "../general/LoadState";
import { PreviewCounts, UnfinishedList } from "./SprintEndPreview";
import { useClosePreview } from "./useClosePreview";
import { completeSprint } from "../../api/sprintsApi";
import { useSubmit } from "../../hooks/useSubmit";
import { TASK_ERROR_MESSAGES } from "../../constants/tasks";
import { errorCode } from "../../utils/apiError";
import { formatDate } from "../../utils/format";
import { completeSprintRequest, GOAL_ACHIEVED } from "../../utils/sprint";
import { fieldErrorsAs, SPRINT_END_FIELD_TEXTS, SPRINT_TEXT_MAX, validateCompleteSprint } from "../../utils/validation";

// a CONFLICT is handled by closing the window (onGone), so its generic text never shows
const MESSAGES = { ...TASK_ERROR_MESSAGES, CONFLICT: "This sprint has already ended." };

const legendSx = { mb: 0.5, fontSize: 14, fontWeight: 600, color: "text.primary", "&.Mui-focused": { color: "text.primary" } };

const daysText = (days) => (days === 1 ? "1 day left" : `${days} days left`);

// The Scrum Master's "Complete sprint" window, named like Jira's (the brief's "close"; PMP-41, sprints-docs §2): the
// close preview's done / unfinished points and the unfinished items, whether the Sprint Goal was achieved (required)
// with an optional note, and where the unfinished work goes (the top of the backlog, a planned sprint, or a new one).
// Before the end date it warns first and the button reads "Complete early"; if the backend still asks
// (EARLY_CLOSE_CONFIRMATION_REQUIRED, the dates changed
// meanwhile) the warning shows and the next press confirms. `onEnded(result)` gets { sprint, carriedOver, toSprint };
// `onGone(text)` is for a sprint someone else ended meanwhile.
const CompleteSprintDialog = ({ sprint, onClose, onEnded, onGone }) => {
  const preview = useClosePreview(sprint.id, onGone);
  const [values, setValues] = useState({ goalAchieved: "", goalNote: "", destination: "backlog", plannedSprintId: "" });
  const [errors, setErrors] = useState({});
  const [confirmEarly, setConfirmEarly] = useState(false); // the backend asked to confirm an early close
  const submit = useSubmit(MESSAGES);

  const data = preview.data;
  const planned = data?.plannedSprints ?? [];
  // the planned sprint picked, or the first one
  const plannedSprintId = values.plannedSprintId || planned[0]?.id || "";
  const early = Boolean(data?.endsEarly) || confirmEarly;

  const set = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data || submit.submitting) return;
    const found = validateCompleteSprint(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const body = completeSprintRequest(
      { ...values, plannedSprintId: plannedSprintId === "" ? null : Number(plannedSprintId) },
      { endsEarly: early },
    );
    const { ok, result, error } = await submit.run(() => completeSprint(sprint.id, body));
    if (ok) {
      onEnded(result);
      return;
    }
    const code = errorCode(error);
    if (code === "EARLY_CLOSE_CONFIRMATION_REQUIRED") {
      setConfirmEarly(true);
      submit.clearError();
    } else if (code === "VALIDATION_ERROR" && error.response.data.fieldErrors) {
      setErrors(fieldErrorsAs(error.response.data.fieldErrors, SPRINT_END_FIELD_TEXTS));
      submit.clearError();
    } else if (code === "CONFLICT") {
      // closed or cancelled by someone else, or the project became read-only: the backend says which
      onGone(error.response.data?.message || "This sprint has already ended.");
    }
  };

  return (
    <Dialog open onClose={submit.submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" noValidate onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5, overflowWrap: "anywhere" }}>Complete sprint: {sprint.name}</DialogTitle>
        <DialogContent>
          {!data ? (
            <LoadState loading={!preview.error} error={preview.error} onRetry={preview.reload} rows={3} />
          ) : (
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <PreviewCounts preview={data} />

              {early && (
                <Alert severity="warning">
                  Planned to end on {formatDate(data.endDate ?? sprint.endDate)}
                  {data.endsEarly && data.daysLeft > 0 ? `, ${daysText(data.daysLeft)}` : ""}. Completing it now ends the
                  sprint early.
                </Alert>
              )}

              {data.unfinishedCount > 0 ? (
                <Box>
                  <Typography sx={{ fontWeight: 600, mb: 1 }}>Unfinished</Typography>
                  <UnfinishedList items={data.unfinished} />
                </Box>
              ) : (
                <Alert severity="success">Everything in this sprint is done.</Alert>
              )}

              <FormControl required error={Boolean(errors.goalAchieved)}>
                <FormLabel id="close-sprint-goal" sx={legendSx}>
                  Sprint Goal achieved?
                </FormLabel>
                {sprint.goal && (
                  <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                    {sprint.goal}
                  </Typography>
                )}
                <RadioGroup row aria-labelledby="close-sprint-goal" value={values.goalAchieved} onChange={set("goalAchieved")}>
                  {GOAL_ACHIEVED.map(({ value, label }) => (
                    <FormControlLabel key={value} value={value} control={<Radio />} label={label} />
                  ))}
                </RadioGroup>
                {errors.goalAchieved && <FormHelperText>{errors.goalAchieved}</FormHelperText>}
              </FormControl>

              <FormField
                id="close-sprint-note"
                label="Note (optional)"
                value={values.goalNote}
                onChange={set("goalNote")}
                placeholder="What helped or got in the way"
                multiline
                minRows={2}
                error={Boolean(errors.goalNote)}
                helperText={errors.goalNote || `${values.goalNote.length} / ${SPRINT_TEXT_MAX}`}
                slotProps={{ htmlInput: { maxLength: SPRINT_TEXT_MAX } }}
              />

              {data.unfinishedCount > 0 && (
                <FormControl>
                  <FormLabel id="close-sprint-destination" sx={legendSx}>
                    Unfinished work goes to
                  </FormLabel>
                  <RadioGroup aria-labelledby="close-sprint-destination" value={values.destination} onChange={set("destination")}>
                    <FormControlLabel value="backlog" control={<Radio />} label="Top of the backlog" />
                    {planned.length > 0 && (
                      <FormControlLabel
                        value="planned"
                        control={<Radio />}
                        label={planned.length === 1 ? `Next planned sprint (${planned[0].name})` : "Next planned sprint"}
                      />
                    )}
                    <FormControlLabel value="new" control={<Radio />} label="A new sprint" />
                  </RadioGroup>
                  {values.destination === "planned" && planned.length > 1 && (
                    <FormField
                      id="close-sprint-planned"
                      select
                      value={plannedSprintId}
                      onChange={set("plannedSprintId")}
                      slotProps={{ htmlInput: { "aria-label": "Planned sprint" } }}
                      sx={{ mt: 0.5, pl: 4 }}
                    >
                      {planned.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.name}
                          {option.startDate ? ` · starts ${formatDate(option.startDate)}` : ""}
                        </MenuItem>
                      ))}
                    </FormField>
                  )}
                </FormControl>
              )}

              {submit.error && <Alert severity="error">{submit.error}</Alert>}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={submit.submitting} color="inherit">
            Not now
          </Button>
          <Button
            type="submit"
            variant="contained"
            color={early ? "warning" : "primary"}
            loading={submit.submitting}
            // a goal answer is required; nothing to send before the preview is there
            disabled={!data || !values.goalAchieved}
          >
            {early ? "Complete early" : "Complete sprint"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default CompleteSprintDialog;

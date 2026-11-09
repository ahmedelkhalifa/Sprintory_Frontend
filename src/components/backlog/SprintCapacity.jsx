import { useState } from "react";
import { Alert, Box, Button, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { getCapacitySuggestion, setAvailability } from "../../api/sprintsApi";
import { useAsync } from "../../hooks/useAsync";
import { useSubmit } from "../../hooks/useSubmit";
import { TASK_ERROR_MESSAGES } from "../../constants/tasks";
import { memberLabel } from "../../utils/people";
import { capacitySummary } from "../../utils/sprint";

// one member's working days in the sprint; saved when the field loses focus
const AvailabilityRow = ({ label, days, workingDays, disabled, onSave }) => {
  const [value, setValue] = useState(String(days));
  const valid = /^\d+$/.test(value) && Number(value) <= workingDays;

  const save = () => {
    if (!valid) {
      setValue(String(days)); // back to the saved value instead of sending one the backend refuses
      return;
    }
    if (Number(value) !== days) onSave(Number(value));
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }} title={label}>
        {label}
      </Typography>
      <TextField
        size="small"
        type="number"
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        error={!valid}
        slotProps={{ htmlInput: { min: 0, max: workingDays, step: 1, "aria-label": `Days ${label} is available` } }}
        sx={{ width: 96 }}
      />
      <Typography variant="body2" color="text.secondary" sx={{ width: 64 }}>
        of {workingDays} days
      </Typography>
    </Box>
  );
};

// Inside Edit sprint (R14, backend sprints-docs §3): the capacity the backend suggests from the team's velocity and
// availability, with "Use" to take it, and each member's working days in the sprint (Viewers don't count). The
// Scrum Master can still pick any capacity. `members` are the project's, for the names.
const SprintCapacity = ({ sprintId, members, onUse }) => {
  const state = useAsync((signal) => getCapacitySuggestion(sprintId, signal), [sprintId], {
    fallback: "Couldn't load the capacity suggestion.",
    messages: TASK_ERROR_MESSAGES,
  });
  const [saved, setSaved] = useState(null); // the answer to the last availability change, newer than the load
  const submit = useSubmit(TASK_ERROR_MESSAGES);
  const suggestion = saved ?? state.data;

  if (state.error) return <Alert severity="warning">{state.error}</Alert>;
  if (!suggestion) return <Skeleton variant="rounded" height={72} />;

  const { suggested, text } = capacitySummary(suggestion);
  const people = new Map(members.map((member) => [member.userId, member]));

  const saveDays = async (userId, availableDays) => {
    const { ok, result } = await submit.run(() => setAvailability(sprintId, userId, availableDays));
    if (ok) setSaved(result);
  };

  return (
    <Box sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {suggested !== null && (
            <Typography sx={{ fontWeight: 600 }}>
              Suggested capacity: {suggested} {suggested === 1 ? "point" : "points"}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            {text}
          </Typography>
        </Box>
        {suggested !== null && (
          <Button size="small" variant="outlined" onClick={() => onUse(suggested)}>
            Use
          </Button>
        )}
      </Box>

      {suggestion.members.length > 0 && (
        <>
          <Typography variant="body2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            Team availability
          </Typography>
          <Stack spacing={1}>
            {suggestion.members.map((member) => (
              <AvailabilityRow
                // a new answer may change the saved days, so the field starts again from them
                key={`${member.userId}-${member.availableDays}`}
                label={people.has(member.userId) ? memberLabel(people.get(member.userId)) : `User ${member.userId}`}
                days={member.availableDays}
                workingDays={suggestion.workingDays}
                disabled={submit.submitting}
                onSave={(days) => saveDays(member.userId, days)}
              />
            ))}
          </Stack>
        </>
      )}
      {submit.error && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {submit.error}
        </Alert>
      )}
    </Box>
  );
};

export default SprintCapacity;

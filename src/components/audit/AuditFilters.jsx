import { useState } from "react";
import { Box, Button, Checkbox, ListItemText, ListSubheader, MenuItem, TextField } from "@mui/material";
import { AUDIT_ACTION_GROUPS } from "../../constants/audit";
import { EMPTY_AUDIT_FILTERS, auditActionLabel, hasAuditFilters, validateDayRange } from "../../utils/audit";

const fieldSx = { minWidth: { sm: 170 }, flex: { xs: "1 1 100%", sm: "0 1 auto" } };

// the filter bar: date range (local calendar days), actor, action type and project. All optional, they combine
// with AND. The picks are a draft until "Apply", which also keeps from > to from ever being sent (the backend
// would answer 400). `filters` are the applied ones; give the bar a `key` that changes with them to reset the draft.
// `actors` and `projects` fill the dropdowns; while they load (or fail) the dropdown only offers "Any".
const AuditFilters = ({ filters, actors, projects, onApply, onClear }) => {
  const [draft, setDraft] = useState(filters);
  const set = (changes) => setDraft((prev) => ({ ...prev, ...changes }));
  const rangeError = validateDayRange(draft.from, draft.to);
  const changed = JSON.stringify(draft) !== JSON.stringify(filters);

  // flat list: a subheader per area, then its actions (MUI's Select can't take fragments)
  const actionOptions = AUDIT_ACTION_GROUPS.flatMap((group) => [
    <ListSubheader key={group.area}>{group.label}</ListSubheader>,
    ...group.actions.map((code) => (
      <MenuItem key={code} value={code}>
        <Checkbox checked={draft.actions.includes(code)} size="small" sx={{ p: 0.5, mr: 1 }} />
        <ListItemText primary={auditActionLabel(code)} />
      </MenuItem>
    )),
  ]);

  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!rangeError) onApply(draft);
      }}
      sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 1.5, px: { xs: 2, sm: 3 }, py: 2 }}
    >
      <TextField
        size="small"
        type="date"
        label="From"
        value={draft.from}
        onChange={(e) => set({ from: e.target.value })}
        error={Boolean(rangeError)}
        helperText={rangeError || " "}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={fieldSx}
      />
      <TextField
        size="small"
        type="date"
        label="To"
        value={draft.to}
        onChange={(e) => set({ to: e.target.value })}
        error={Boolean(rangeError)}
        helperText=" "
        slotProps={{ inputLabel: { shrink: true } }}
        sx={fieldSx}
      />

      <TextField
        select
        size="small"
        label="Actor"
        value={draft.actorId}
        onChange={(e) => set({ actorId: e.target.value })}
        slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        sx={{ ...fieldSx, minWidth: { sm: 200 } }}
      >
        <MenuItem value="">Anyone</MenuItem>
        {/* an actor from the url the list doesn't hold (yet) still has to be an option */}
        {draft.actorId && !actors.some((a) => String(a.id) === draft.actorId) && (
          <MenuItem value={draft.actorId}>User {draft.actorId}</MenuItem>
        )}
        {actors.map((actor) => (
          <MenuItem key={actor.id} value={String(actor.id)}>
            <ListItemText primary={actor.name} secondary={actor.email} />
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Action"
        value={draft.actions}
        onChange={(e) => set({ actions: e.target.value })}
        slotProps={{
          select: {
            multiple: true,
            displayEmpty: true,
            renderValue: (selected) =>
              selected.length === 0
                ? "Any action"
                : selected.length === 1
                  ? auditActionLabel(selected[0])
                  : `${selected.length} actions`,
            MenuProps: { slotProps: { paper: { sx: { maxHeight: 420 } } } },
          },
          inputLabel: { shrink: true },
        }}
        sx={{ ...fieldSx, minWidth: { sm: 200 } }}
      >
        {actionOptions}
      </TextField>

      <TextField
        select
        size="small"
        label="Project"
        value={draft.projectId}
        onChange={(e) => set({ projectId: e.target.value })}
        slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        sx={{ ...fieldSx, minWidth: { sm: 200 } }}
      >
        <MenuItem value="">Any project</MenuItem>
        {draft.projectId && !projects.some((p) => String(p.id) === draft.projectId) && (
          <MenuItem value={draft.projectId}>Project {draft.projectId}</MenuItem>
        )}
        {projects.map((project) => (
          <MenuItem key={project.id} value={String(project.id)}>
            {project.name}
          </MenuItem>
        ))}
      </TextField>

      <Box sx={{ display: "flex", gap: 1, pt: 0.25 }}>
        <Button type="submit" variant="contained" disabled={Boolean(rangeError) || !changed}>
          Apply
        </Button>
        <Button
          color="inherit"
          disabled={!hasAuditFilters(draft) && !hasAuditFilters(filters)}
          onClick={() => {
            setDraft(EMPTY_AUDIT_FILTERS);
            onClear();
          }}
        >
          Clear filters
        </Button>
      </Box>
    </Box>
  );
};

export default AuditFilters;

import { Alert, Box, Button, LinearProgress, Typography } from "@mui/material";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import SearchField from "../../general/SearchField";
import AssigneeFilter from "./AssigneeFilter";
import FilterSelect from "./FilterSelect";
import { TASK_PRIORITIES, TASK_TYPES } from "../../../constants/tasks";
import { EMPTY_TASK_FILTERS, hasTaskFilters } from "../../../utils/taskFilters";

const TYPE_OPTIONS = Object.values(TASK_TYPES);
const PRIORITY_OPTIONS = Object.values(TASK_PRIORITIES);

// The Board and Backlog's filter row (Jira's "filter by"): search by title or key, assignee avatars, and
// Type / Priority / Status / Label. One value per filter; the backend does the matching (useTaskFilterMatches).
// `match` is that hook's result, `shown` / `total` count the tasks for "Showing 4 of 23 tasks",
// `actions` sits on the right (e.g. Create sprint).
const TaskFilterBar = ({ filters, onChange, members, columns, labels, match, shown, total, actions }) => {
  const set = (name, value) => onChange({ ...filters, [name]: value });
  const filtering = hasTaskFilters(filters);

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
        <SearchField value={filters.q} onChange={(q) => set("q", q)} placeholder="Search by title or key" />
        <AssigneeFilter members={members} value={filters.assigneeId} onChange={(id) => set("assigneeId", id)} />
        <FilterSelect label="Type" value={filters.type} options={TYPE_OPTIONS} onChange={(v) => set("type", v)} />
        <FilterSelect
          label="Priority"
          value={filters.priority}
          options={PRIORITY_OPTIONS}
          onChange={(v) => set("priority", v)}
        />
        <FilterSelect
          label="Status"
          value={filters.statusId}
          options={columns.map((column) => ({ value: column.id, label: column.name }))}
          onChange={(v) => set("statusId", v)}
        />
        <FilterSelect
          label="Label"
          value={filters.label}
          options={labels.map((label) => ({ value: label, label }))}
          onChange={(v) => set("label", v)}
          emptyText="No labels used yet"
        />
        {filtering && (
          <Button
            size="small"
            color="inherit"
            startIcon={<FilterAltOffOutlinedIcon />}
            onClick={() => onChange(EMPTY_TASK_FILTERS)}
            sx={{ height: 40, color: "text.secondary" }}
          >
            Clear filters
          </Button>
        )}
        {actions && <Box sx={{ ml: { sm: "auto" } }}>{actions}</Box>}
      </Box>

      {filtering && (
        <Box sx={{ mt: 1.25 }}>
          {match.error ? (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={match.reload}>
                  Try again
                </Button>
              }
            >
              {match.error}
            </Alert>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" aria-live="polite">
                {match.loading && match.matches === null ? "Filtering…" : `Showing ${shown} of ${total} ${total === 1 ? "task" : "tasks"}`}
              </Typography>
              {/* a thin line while the backend answers, so a slow filter doesn't look stuck */}
              <LinearProgress sx={{ mt: 0.75, height: 2, borderRadius: 1, visibility: match.loading ? "visible" : "hidden" }} />
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default TaskFilterBar;

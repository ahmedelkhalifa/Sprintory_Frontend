import { Alert, Box, Button, LinearProgress, Typography } from "@mui/material";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import ViewColumnOutlinedIcon from "@mui/icons-material/ViewColumnOutlined";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import SearchField from "../../general/SearchField";
import UserAvatar from "../../general/UserAvatar";
import FilterPanel from "./FilterPanel";
import ActiveFilterChips from "./ActiveFilterChips";
import { TASK_PRIORITIES, TASK_TYPES } from "../../../constants/tasks";
import { memberLabel } from "../../../utils/people";
import { labelTone } from "../../../utils/task";
import { EMPTY_TASK_FILTERS, hasTaskFilters } from "../../../utils/taskFilters";

// the Filter window's types, in order; `id` is the filter's name in EMPTY_TASK_FILTERS
const filterGroups = ({ members, columns, labels }) => [
  {
    id: "assigneeId",
    name: "Assignee",
    anyLabel: "Any assignee",
    Icon: PersonOutlinedIcon,
    searchPlaceholder: "Search people…",
    emptyText: "No members in this project yet.",
    options: members.map((member) => ({
      value: member.userId,
      label: memberLabel(member),
      secondary: member.email,
      avatar: <UserAvatar user={member} size={30} />,
    })),
  },
  {
    id: "type",
    name: "Type",
    anyLabel: "Any type",
    Icon: CheckBoxOutlinedIcon,
    options: Object.values(TASK_TYPES),
  },
  {
    id: "priority",
    name: "Priority",
    anyLabel: "Any priority",
    Icon: FlagOutlinedIcon,
    options: Object.values(TASK_PRIORITIES),
  },
  {
    id: "statusId",
    name: "Status",
    anyLabel: "Any status",
    Icon: ViewColumnOutlinedIcon,
    options: columns.map((column) => ({ value: column.id, label: column.name })),
  },
  {
    id: "label",
    name: "Label",
    anyLabel: "Any label",
    Icon: LabelOutlinedIcon,
    searchPlaceholder: "Search labels…",
    emptyText: "No labels used yet. Add one to a task to filter by it.",
    options: labels.map((label) => ({ value: label, label, dotTone: labelTone(label) })),
  },
];

// The Board and Backlog's filter row (Jira's "filter by"): the search box (title or key), the Filter button with
// its two-pane window (Assignee / Type / Priority / Status / Label), the picked filters as chips, and how many tasks
// show. One value per filter; the backend does the matching (useTaskFilterMatches).
// `match` is that hook's result, `shown` / `total` count the tasks for "Showing 4 of 23 tasks",
// `actions` sits on the right (e.g. Create sprint, Create task).
const TaskFilterBar = ({ filters, onChange, members, columns, labels, match, shown, total, actions }) => {
  const groups = filterGroups({ members, columns, labels });
  const filtering = hasTaskFilters(filters);

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
        <SearchField value={filters.q} onChange={(q) => onChange({ ...filters, q })} placeholder="Search by title or key" />
        <FilterPanel filters={filters} onChange={onChange} groups={groups} />
        {filtering && (
          <Button
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
        <Box sx={{ mt: 1.25, display: "flex", flexDirection: "column", gap: 1 }}>
          <ActiveFilterChips filters={filters} groups={groups} onRemove={(id) => onChange({ ...filters, [id]: null })} />
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
            <Box>
              <Typography variant="body2" color="text.secondary" aria-live="polite">
                {match.loading && match.matches === null ? "Filtering…" : `Showing ${shown} of ${total} ${total === 1 ? "task" : "tasks"}`}
              </Typography>
              {/* a thin line while the backend answers, so a slow filter doesn't look stuck */}
              <LinearProgress sx={{ mt: 0.75, height: 2, borderRadius: 1, visibility: match.loading ? "visible" : "hidden" }} />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default TaskFilterBar;

import { Alert, Box, Button, Chip, LinearProgress, Typography } from "@mui/material";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import ViewColumnOutlinedIcon from "@mui/icons-material/ViewColumnOutlined";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import BlockIcon from "@mui/icons-material/Block";
import SearchField from "../../general/SearchField";
import UserAvatar from "../../general/UserAvatar";
import FilterPanel from "./FilterPanel";
import ActiveFilterChips from "./ActiveFilterChips";
import { TASK_PRIORITIES, TASK_TYPES } from "../../../constants/tasks";
import { memberLabel } from "../../../utils/people";
import { labelTone } from "../../../utils/task";
import { EMPTY_TASK_FILTERS, hasTaskFilters } from "../../../utils/taskFilters";
import FlagCircleOutlinedIcon from "@mui/icons-material/FlagCircleOutlined";
import { NO_MILESTONE_VALUE } from "../../../utils/taskFilters";

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
  {
    id: "milestoneId",
    name: "Milestone",
    anyLabel: "Any milestone",
    Icon: FlagCircleOutlinedIcon,
    searchPlaceholder: "Search milestones…",
    emptyText: "No milestones in this project yet.",
    options: [
      { value: NO_MILESTONE_VALUE, label: "No milestone" },
      ...milestones.map((m) => ({ value: m.id, label: m.name })),
    ],
  },
];

// The Board and Backlog's filter row (Jira's "filter by"): the search box (title or key), the Filter button with
// its two-pane window (Assignee / Type / Priority / Status / Label), the Blocked only toggle (tasks with an open
// blocker, PMP-45), the picked filters as chips, and how many tasks show. One value per filter; the backend does the
// matching (useTaskFilterMatches).
// `match` is that hook's result, `shown` / `total` count the tasks for "Showing 4 of 23 tasks",
// `actions` sits on the right (e.g. Create sprint, Create task).
const TaskFilterBar = ({ filters, onChange, members, columns, milestones = [], labels, match, shown, total, actions }) => {
  const groups = filterGroups({ members, columns, labels, milestones });
  const filtering = hasTaskFilters(filters);

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
        <SearchField value={filters.q} onChange={(q) => onChange({ ...filters, q })} placeholder="Search by title or key" />
        <FilterPanel filters={filters} onChange={onChange} groups={groups} />
        <Button
          variant="outlined"
          color={filters.blockedOnly ? "primary" : "inherit"}
          startIcon={<BlockIcon />}
          aria-pressed={Boolean(filters.blockedOnly)}
          onClick={() => onChange({ ...filters, blockedOnly: !filters.blockedOnly })}
          sx={{
            height: 40,
            fontWeight: 600,
            borderColor: filters.blockedOnly ? "primary.main" : "divider",
            bgcolor: filters.blockedOnly ? "navActive.background" : "background.paper",
          }}
        >
          Blocked only
        </Button>
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
          {(groups.some((group) => filters[group.id] != null) || filters.blockedOnly) && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <ActiveFilterChips filters={filters} groups={groups} onRemove={(id) => onChange({ ...filters, [id]: null })} />
              {filters.blockedOnly && (
                <Chip
                  size="small"
                  label={
                    <Box component="strong" sx={{ fontWeight: 700 }}>
                      Blocked tasks only
                    </Box>
                  }
                  onDelete={() => onChange({ ...filters, blockedOnly: false })}
                  sx={{
                    height: 28,
                    bgcolor: "navActive.background",
                    color: "navActive.text",
                    "& .MuiChip-deleteIcon": { color: "navActive.text", opacity: 0.6, "&:hover": { opacity: 1, color: "navActive.text" } },
                  }}
                />
              )}
            </Box>
          )}
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

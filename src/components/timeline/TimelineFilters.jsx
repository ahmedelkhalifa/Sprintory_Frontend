import { Box, Button } from "@mui/material";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import FlagCircleOutlinedIcon from "@mui/icons-material/FlagCircleOutlined";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import ViewColumnOutlinedIcon from "@mui/icons-material/ViewColumnOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import UserAvatar from "../general/UserAvatar";
import FilterPanel from "../tasks/filters/FilterPanel";
import ActiveFilterChips from "../tasks/filters/ActiveFilterChips";
import { filterButtonSx } from "../tasks/filters/filterStyles";
import { TASK_TYPES } from "../../constants/tasks";
import { formatDate } from "../../utils/format";
import { memberLabel } from "../../utils/people";
import { EMPTY_TIMELINE_FILTERS, hasTimelineFilters } from "../../utils/schedule";

// The Filter window's groups (PMP-48 AC 15; backend schedule-docs §2); `id` is the filter's query param. `options`
// holds what they are made from: { members, columns, sprints, milestones, scrum }. The milestones come from the
// schedule itself (always the whole project's); the sprint filter only exists in Scrum
const filterGroups = ({ members = [], columns = [], sprints = [], milestones = [], scrum }) => [
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
    id: "milestoneId",
    name: "Milestone",
    anyLabel: "Any milestone",
    Icon: FlagCircleOutlinedIcon,
    emptyText: "This project has no milestones yet.",
    options: milestones.map((milestone) => ({
      value: milestone.id,
      label: milestone.name,
      secondary: formatDate(milestone.targetDate),
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
    id: "statusId",
    name: "Status",
    anyLabel: "Any status",
    Icon: ViewColumnOutlinedIcon,
    options: columns.map((column) => ({ value: column.id, label: column.name })),
  },
  ...(scrum
    ? [
        {
          id: "sprintId",
          name: "Sprint",
          anyLabel: "Any sprint",
          Icon: TimerOutlinedIcon,
          emptyText: "No planned or active sprints.",
          options: sprints.map((sprint) => ({
            value: sprint.id,
            label: sprint.name,
            secondary: sprint.status === "ACTIVE" ? "Active" : "Planned",
          })),
        },
      ]
    : []),
];

// The Timeline's filters, on the toolbar's left: the Filter window (the Board's FilterPanel with the groups above),
// the Hide done toggle (AC 12) and Clear filters. The backend does the filtering
const TimelineFilters = ({ filters, onChange, options }) => (
  <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
    <FilterPanel filters={filters} onChange={onChange} groups={filterGroups(options)} />
    <Button
      variant="outlined"
      color={filters.hideDone ? "primary" : "inherit"}
      startIcon={<CheckCircleOutlinedIcon />}
      aria-pressed={Boolean(filters.hideDone)}
      onClick={() => onChange({ ...filters, hideDone: !filters.hideDone })}
      sx={filterButtonSx(filters.hideDone)}
    >
      Hide done
    </Button>
    {hasTimelineFilters(filters) && (
      <Button
        color="inherit"
        startIcon={<FilterAltOffOutlinedIcon />}
        onClick={() => onChange(EMPTY_TIMELINE_FILTERS)}
        sx={{ height: 40, color: "text.secondary" }}
      >
        Clear filters
      </Button>
    )}
  </Box>
);

// the picked filters as chips under the toolbar ("Milestone: Beta release ✕"); ✕ clears that one
export const TimelineFilterChips = ({ filters, onChange, options }) => (
  <ActiveFilterChips filters={filters} groups={filterGroups(options)} onRemove={(id) => onChange({ ...filters, [id]: null })} />
);

export default TimelineFilters;

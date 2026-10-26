import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import BugReportOutlinedIcon from "@mui/icons-material/BugReportOutlined";
import KeyboardDoubleArrowUpIcon from "@mui/icons-material/KeyboardDoubleArrowUp";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

// Task and sprint values as the backend will send them.
// ASSUMED until the backend has tasks (R09) and sprints (R13/R14): see dev-docs/tasks.md

export const TASK_TYPES = {
  STORY: { value: "STORY", label: "Story", Icon: BookmarkBorderOutlinedIcon, tone: "success.main" },
  TASK: { value: "TASK", label: "Task", Icon: CheckBoxOutlinedIcon, tone: "info.main" },
  BUG: { value: "BUG", label: "Bug", Icon: BugReportOutlinedIcon, tone: "error.main" },
};

// a label only: the real ranking is the task's place in the backlog
export const TASK_PRIORITIES = {
  CRITICAL: { value: "CRITICAL", label: "Critical", Icon: KeyboardDoubleArrowUpIcon, tone: "error.main" },
  HIGH: { value: "HIGH", label: "High", Icon: KeyboardArrowUpIcon, tone: "warning.main" },
  MEDIUM: { value: "MEDIUM", label: "Medium", Icon: DragHandleIcon, tone: "info.main" },
  LOW: { value: "LOW", label: "Low", Icon: KeyboardArrowDownIcon, tone: "text.secondary" },
};

// also the Scrum board's columns, in this order
export const TASK_STATUSES = {
  TODO: { value: "TODO", label: "To Do", tone: "text.secondary" },
  IN_PROGRESS: { value: "IN_PROGRESS", label: "In Progress", tone: "info.main" },
  IN_REVIEW: { value: "IN_REVIEW", label: "In Review", tone: "warning.main" },
  DONE: { value: "DONE", label: "Done", tone: "success.main" },
};

export const SPRINT_STATUS = {
  PLANNED: { value: "PLANNED", label: "Planned", tone: "text.secondary" },
  ACTIVE: { value: "ACTIVE", label: "Active", tone: "success.main" },
  COMPLETED: { value: "COMPLETED", label: "Completed", tone: "primary.main" },
};

// what to tell the user when a change is refused, by error code
export const TASK_ERROR_MESSAGES = {
  ACCESS_DENIED: "You don't have permission to do this.",
  RESOURCE_NOT_FOUND: "This task or sprint no longer exists, or you no longer have access to it.",
  WORKSPACE_ARCHIVED: "This workspace is archived. Restore it to make changes.",
  PROJECT_ARCHIVED: "This project is archived. Restore it to make changes.",
  SPRINT_ALREADY_ACTIVE: "Another sprint is already active. Complete it before starting this one.",
};

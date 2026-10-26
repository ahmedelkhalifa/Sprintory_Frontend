import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import BugReportOutlinedIcon from "@mui/icons-material/BugReportOutlined";
import KeyboardDoubleArrowUpIcon from "@mui/icons-material/KeyboardDoubleArrowUp";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardDoubleArrowDownIcon from "@mui/icons-material/KeyboardDoubleArrowDown";

// Task values as the backend sends them (backend docs/tasks-docs.md).
// Sprint values are still ASSUMED until the backend has sprints (R14/R15): see dev-docs/tasks.md

export const TASK_TYPES = {
  STORY: { value: "STORY", label: "Story", Icon: BookmarkBorderOutlinedIcon, tone: "success.main" },
  TASK: { value: "TASK", label: "Task", Icon: CheckBoxOutlinedIcon, tone: "info.main" },
  BUG: { value: "BUG", label: "Bug", Icon: BugReportOutlinedIcon, tone: "error.main" },
};

// a label only: the real ranking is the task's place in the backlog
export const TASK_PRIORITIES = {
  HIGHEST: { value: "HIGHEST", label: "Highest", Icon: KeyboardDoubleArrowUpIcon, tone: "error.main" },
  HIGH: { value: "HIGH", label: "High", Icon: KeyboardArrowUpIcon, tone: "warning.main" },
  MEDIUM: { value: "MEDIUM", label: "Medium", Icon: DragHandleIcon, tone: "info.main" },
  LOW: { value: "LOW", label: "Low", Icon: KeyboardArrowDownIcon, tone: "text.secondary" },
  LOWEST: { value: "LOWEST", label: "Lowest", Icon: KeyboardDoubleArrowDownIcon, tone: "text.disabled" },
};

// a task's status is a board column; its stage (first column / in between / last column) picks the chip color
export const TASK_STAGES = {
  TODO: { value: "TODO", tone: "text.secondary" },
  IN_PROGRESS: { value: "IN_PROGRESS", tone: "info.main" },
  DONE: { value: "DONE", tone: "success.main" },
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

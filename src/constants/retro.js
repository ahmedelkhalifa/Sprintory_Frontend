// Sprint retrospective values as the backend sends them (retrospectives-docs.md)

// the three fixed columns, in the order they're shown
export const RETRO_COLUMNS = [
  { value: "WENT_WELL", label: "Went well" },
  { value: "TO_IMPROVE", label: "To improve" },
  { value: "IDEAS", label: "Ideas" },
];

// a retro is open as soon as it exists, and a closed one is never reopened
export const RETRO_STATUS = {
  OPEN: { value: "OPEN", label: "Open", tone: "success.main" },
  CLOSED: { value: "CLOSED", label: "Closed", tone: "text.secondary" },
};

// how often an open retro on screen loads other people's changes (the backend has no live updates)
export const RETRO_POLL_MS = 20000;

// the text of one card, the same as the backend's check
export const RETRO_CARD_MAX = 1000;

// where an action's task goes: the end of the backlog, or a planned sprint
export const RETRO_DESTINATION = { BACKLOG: "backlog", SPRINT: "sprint" };

// refusals that mean the page is out of date (someone closed the retro, deleted the card, or the votes moved on)
export const RETRO_REFRESH_CODES = ["RETRO_CLOSED", "ALREADY_VOTED", "NO_VOTES_LEFT", "RESOURCE_NOT_FOUND"];

// what to tell the user when something is refused, by error code
export const RETRO_ERROR_MESSAGES = {
  ACCESS_DENIED: "You don't have permission to do this.",
  RETRO_SPRINT_NOT_ENDED: "The sprint must be completed or cancelled first.",
  RETRO_CLOSED: "This retrospective is closed, so it can't change anymore.",
  ALREADY_VOTED: "You already voted on this card.",
  NO_VOTES_LEFT: "You have no votes left. Remove one to use it here.",
  WORKSPACE_ARCHIVED: "This workspace is archived. Restore it to make changes.",
  // the backend says what is missing (the card, the retro or the sprint), and why the project is read-only
  RESOURCE_NOT_FOUND: null,
  CONFLICT: null,
};

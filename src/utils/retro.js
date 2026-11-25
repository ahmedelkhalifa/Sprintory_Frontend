import { PERMISSIONS } from "../constants/projects.js";
import { RETRO_DESTINATION } from "../constants/retro.js";
import { can, projectTabPath } from "./project.js";
import { docText, toDoc } from "./richText.js";
import { isSprintEnded } from "./sprint.js";
import { TASK_TITLE_MAX } from "./validation.js";

// Sprint retrospective helpers (PMP-148, backend retrospectives-docs.md). Pure, so they can be unit tested.

// ---------- getting there ----------

// a retro's own page, under the Sprints tab
export const retroPath = (workspace, project, retroId) => `${projectTabPath(workspace, project, "sprints")}/retros/${retroId}`;

/**
 * What an ended sprint offers: "open" (it has a retro, for everyone who can see the work), "create" (it has none and
 * the caller may make one) or null. `writable` is false in an archived workspace or a read-only project, where an
 * existing retro can still be read.
 */
export const retroEntry = (sprint, project, { writable = true } = {}) => {
  if (project?.template !== "SCRUM" || !isSprintEnded(sprint)) return null;
  if (sprint.retroId != null) return can(project, PERMISSIONS.VIEW_WORK) ? "open" : null;
  return writable && can(project, PERMISSIONS.RETRO_MANAGE) ? "create" : null;
};

// ---------- cards and votes ----------

const time = (item) => Date.parse(item.createdAt) || 0;
const oldestFirst = (a, b) => time(a) - time(b) || a.id - b.id;

// one column's cards, oldest first; `byVotes` puts the most votes first (ties: oldest first)
export const columnItems = (items = [], column, { byVotes = false } = {}) =>
  items
    .filter((item) => item.column === column)
    .sort((a, b) => (byVotes ? b.voteCount - a.voteCount : 0) || oldestFirst(a, b));

// the retro after a card was added (last) or edited (in its place)
export const replaceItem = (retro, item) => ({
  ...retro,
  items: retro.items.some((other) => other.id === item.id)
    ? retro.items.map((other) => (other.id === item.id ? item : other))
    : [...retro.items, item],
});

// the retro after a card was deleted, like the backend does it: the caller's vote on it comes back, and an action
// made from it stays without its card
export const removeItem = (retro, itemId) => {
  const item = retro.items.find((other) => other.id === itemId);
  if (!item) return retro;
  return {
    ...retro,
    items: retro.items.filter((other) => other.id !== itemId),
    votesLeft: item.votedByMe ? Math.min(retro.votesLeft + 1, retro.votesPerMember) : retro.votesLeft,
    actions: retro.actions.map((action) => (action.itemId === itemId ? { ...action, itemId: null } : action)),
  };
};

// the retro after a vote call: the card's new state and the caller's remaining votes, from its answer
export const applyVote = (retro, { itemId, voteCount, votedByMe, votesLeft }) => ({
  ...retro,
  votesLeft,
  items: retro.items.map((item) => (item.id === itemId ? { ...item, voteCount, votedByMe } : item)),
});

// ---------- actions ----------

export const EMPTY_RETRO_ACTION = { title: "", owner: null, destination: RETRO_DESTINATION.BACKLOG, sprintId: "" };

// a card's text as a task title: one line, cut to the longest title a task can have (never in the middle of an emoji)
export const actionTitle = (body) =>
  docText(toDoc(body))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, TASK_TITLE_MAX)
    .replace(/[\uD800-\uDBFF]$/, "")
    .trim();

// what the "Create action" window has wrong, by the backend's field names: the title and the owner are required,
// and so is a sprint when that's where the task goes
export const validateRetroAction = ({ title, owner, destination, sprintId }) => {
  const text = (title ?? "").trim();
  const errors = {};
  if (!text) errors.title = "Title is required";
  else if (text.length > TASK_TITLE_MAX) errors.title = `Use at most ${TASK_TITLE_MAX} characters`;
  if (!owner) errors.ownerId = "Choose an owner";
  if (destination === RETRO_DESTINATION.SPRINT && !sprintId) errors.sprintId = "Choose a sprint";
  return errors;
};

// the body of POST /retros/{id}/actions; `itemId` is the card it came from. No sprint = the backlog
export const retroActionRequest = ({ title, owner, destination, sprintId }, itemId = null) => ({
  title: title.trim(),
  ownerId: owner.userId,
  ...(itemId != null && { itemId }),
  ...(destination === RETRO_DESTINATION.SPRINT && { sprintId: Number(sprintId) }),
});

import {
  AUDIT_ACTIONS,
  AUDIT_ACTION_GROUPS,
  AUDIT_FIELD_LABELS,
  SENSITIVE_FIELD,
} from "../constants/audit.js";
import { TEMPLATES } from "../constants/projects.js";
import { projectRoleLabel } from "./project.js";
import { ROLE_LABEL } from "./workspace.js";

// "PROJECT_ROLES_CHANGED" -> "Project roles changed"; "failedAttempts" -> "Failed attempts"
const humanize = (text) => {
  const words = String(text ?? "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

// an action the backend adds later still shows up, readable, until it is added to AUDIT_ACTIONS
export const auditActionLabel = (action) => AUDIT_ACTIONS[action]?.label ?? humanize(action);

// the actor's name as stored in the entry; the system (nobody signed in) has no actor
export const actorLabel = (entry) => entry?.actor?.name || "System";

// ---- times ----

const pad = (n) => String(n).padStart(2, "0");

// the log is in UTC: "2026-11-02 14:05:31 UTC", for the tooltip. "" for a missing or broken date
export const formatUtc = (date) => {
  const d = new Date(date);
  if (!date || Number.isNaN(d.getTime())) return "";
  const day = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  return `${day} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
};

// the viewer's local time, for the table: "Nov 2, 2026, 4:05 PM"
export const formatLocal = (date) => {
  const d = new Date(date);
  if (!date || Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
};

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

// local start of a "YYYY-MM-DD" day, `plusDays` later; null when it isn't a real date
const localDayStart = (day, plusDays = 0) => {
  const match = DAY.exec(day ?? "");
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  // "2026-02-31" rolls over to March: not a real day
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return new Date(y, m - 1, d + plusDays);
};

// "" when the date range may be sent, otherwise the text to show; the page disables Apply instead of sending
// from >= to (the backend answers 400). Both ends are optional local calendar days "YYYY-MM-DD"
export const validateDayRange = (from, to) => {
  if (from && !localDayStart(from)) return "Enter a valid start date.";
  if (to && !localDayStart(to)) return "Enter a valid end date.";
  if (from && to && from > to) return "The start date must not be after the end date.";
  return "";
};

// the days the user picked, as the instants the backend takes: `from` is the local start of the first day,
// `to` the local start of the day AFTER the last one (the backend's `to` is exclusive). { from?, to? } in ISO UTC
export const dayRangeToInstants = (from, to) => {
  const start = from ? localDayStart(from) : null;
  const end = to ? localDayStart(to, 1) : null;
  return { ...(start && { from: start.toISOString() }), ...(end && { to: end.toISOString() }) };
};

// ---- filters ----

export const EMPTY_AUDIT_FILTERS = { from: "", to: "", actorId: "", projectId: "", actions: [] };

export const hasAuditFilters = (filters) =>
  Boolean(filters.from || filters.to || filters.actorId || filters.projectId || filters.actions.length > 0);

// the query the backend gets; blank filters are left out, so the whole log comes back
export const auditQuery = (filters) => ({
  ...dayRangeToInstants(filters.from, filters.to),
  ...(filters.actorId && { actorId: filters.actorId }),
  ...(filters.projectId && { projectId: filters.projectId }),
  ...(filters.actions.length > 0 && { actions: filters.actions.join(",") }),
});

const KNOWN_ACTIONS = new Set(AUDIT_ACTION_GROUPS.flatMap((group) => group.actions));
const POSITIVE_ID = /^[1-9]\d{0,15}$/;

// the filters kept in the page url (?from=2026-11-01&to=2026-11-02&actor=17&project=15&actions=A,B), so a filtered
// view can be reloaded or sent to another admin. The url is user input: anything invalid is ignored
export const filtersFromSearchParams = (params) => {
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const actor = params.get("actor") ?? "";
  const project = params.get("project") ?? "";
  const actions = (params.get("actions") ?? "").split(",").filter((code) => KNOWN_ACTIONS.has(code));
  const days = !validateDayRange(from, to) ? { from, to } : { from: "", to: "" };
  return {
    ...days,
    actorId: POSITIVE_ID.test(actor) ? actor : "",
    projectId: POSITIVE_ID.test(project) ? project : "",
    actions: [...new Set(actions)],
  };
};

export const filtersToSearchParams = (filters) => {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.actorId) params.set("actor", filters.actorId);
  if (filters.projectId) params.set("project", filters.projectId);
  if (filters.actions.length > 0) params.set("actions", filters.actions.join(","));
  return params;
};

// ---- what changed ----

// one old or new value as text. Only the fields that hold API names get labels (a description that happens to
// contain "MEMBER" stays as written). A set of project roles is one "A, B" string; MEMBER is "Member" here,
// the entry doesn't say whether the project is Scrum
const VALUE_FORMATS = {
  role: (value) => ROLE_LABEL[value] ?? value,
  roles: (value) => value.split(", ").map((role) => projectRoleLabel(role)).join(", "),
  template: (value) => TEMPLATES[value]?.label ?? value,
};

const formatValue = (field, value) => {
  const text = String(value);
  return VALUE_FORMATS[field] ? VALUE_FORMATS[field](text) : text;
};

// what changed, ready to show: [{ key, label, kind, oldText, newText }].
// kind: "added" (oldValue null: only the new value is shown), "removed" (newValue null: the old value, struck
// through) or "changed" (old → new). Changes of anything that looks like a password, token or link are dropped
export const visibleChanges = (entry) =>
  (Array.isArray(entry?.changes) ? entry.changes : [])
    .filter((change) => change && !SENSITIVE_FIELD.test(String(change.field ?? "")))
    .map((change, index) => {
      const hasOld = change.oldValue !== null && change.oldValue !== undefined && change.oldValue !== "";
      const hasNew = change.newValue !== null && change.newValue !== undefined && change.newValue !== "";
      return {
        key: `${index}-${change.field}`,
        field: change.field,
        label: AUDIT_FIELD_LABELS[change.field] ?? humanize(change.field),
        kind: hasOld && hasNew ? "changed" : hasNew ? "added" : "removed",
        oldText: hasOld ? formatValue(change.field, change.oldValue) : "",
        newText: hasNew ? formatValue(change.field, change.newValue) : "",
      };
    });

// long values (project descriptions are free text) are cut for the table; the full text goes in a tooltip
export const truncateText = (text, max = 60) =>
  text.length > max ? { text: `${text.slice(0, max - 1).trimEnd()}…`, truncated: true } : { text, truncated: false };

// ---- one sentence per entry (the phone view) ----

// " from A to B" when both values are there, so a sentence never ends in an empty "from  to "
const fromTo = (change, quote = "") =>
  change?.oldText && change?.newText ? ` from ${quote}${change.oldText}${quote} to ${quote}${change.newText}${quote}` : "";

// the suggested sentences of audit-log-docs.md §4, from the names stored in the entry.
// `c` holds the entry's visible changes by field
const SENTENCES = {
  WORKSPACE_RENAMED: ({ actor, c }) => `${actor} renamed the workspace${fromTo(c.name, '"')}`,
  MEMBER_INVITED: ({ actor, target }) => `${actor} invited ${target}`,
  MEMBER_JOINED: ({ target }) => `${target} joined the workspace`,
  MEMBER_REMOVED: ({ actor, target }) => `${actor} removed ${target} from the workspace`,
  MEMBER_LEFT: ({ target }) => `${target} left the workspace`,
  WORKSPACE_ROLE_CHANGED: ({ actor, target, c }) => `${actor} changed ${target}'s workspace role${fromTo(c.role)}`,
  TEAM_CREATED: ({ actor, target }) => `${actor} created the team "${target}"`,
  TEAM_RENAMED: ({ actor, target, c }) =>
    c.name?.oldText && c.name?.newText
      ? `${actor} renamed the team "${c.name.oldText}" to "${c.name.newText}"`
      : `${actor} renamed the team "${target}"`,
  TEAM_DELETED: ({ actor, target }) => `${actor} deleted the team "${target}"`,
  TEAM_MEMBER_ADDED: ({ actor, target, c }) =>
    `${actor} added ${target} to the team${c.team?.newText ? ` "${c.team.newText}"` : ""}`,
  TEAM_MEMBER_REMOVED: ({ actor, target, c }) =>
    `${actor} removed ${target} from the team${c.team?.oldText ? ` "${c.team.oldText}"` : ""}`,
  PROJECT_CREATED: ({ actor, target, c }) => {
    const details = [c.key?.newText, c.template?.newText].filter(Boolean).join(", ");
    return `${actor} created the project "${target}"${details ? ` (${details})` : ""}`;
  },
  PROJECT_SETTINGS_CHANGED: ({ actor, project }) => `${actor} changed the settings of "${project}"`,
  PROJECT_MEMBER_ADDED: ({ actor, target, project, c }) =>
    `${actor} added ${target} to "${project}"${c.viaTeam?.newText ? ` (via team "${c.viaTeam.newText}")` : ""}`,
  PROJECT_MEMBER_REMOVED: ({ actor, target, project }) => `${actor} removed ${target} from "${project}"`,
  PROJECT_ROLES_CHANGED: ({ actor, target, project, c }) =>
    `${actor} changed ${target}'s roles in "${project}"${fromTo(c.roles)}`,
  TASK_DELETED: ({ actor, target, project }) => `${actor} deleted ${target} in "${project}"`,
  TASK_RESTORED: ({ actor, target, project }) => `${actor} restored ${target} in "${project}"`,
  PASSWORD_RESET: ({ target }) => `${target} reset their password`,
  LOGIN_FAILED_REPEATED: ({ target, c }) => `${c.failedAttempts?.newText || "Repeated"} failed sign-in attempts for ${target}`,
};

// "Ada Lovelace changed Linus Torvalds's roles in "Mobile App" from Member to Project Manager, Member".
// An action the app doesn't know yet reads "actor · action · target"
export const auditSentence = (entry) => {
  const actor = actorLabel(entry);
  const target = entry?.target?.name || "—";
  const sentence = SENTENCES[entry?.action];
  if (!sentence) return `${actor} · ${auditActionLabel(entry?.action)} · ${target}`;
  const c = Object.fromEntries(visibleChanges(entry).map((change) => [change.field, change]));
  return sentence({ actor, target, project: entry.project?.name || "—", c });
};

// the sentence already says what changed, except for settings edits (which fields, and long descriptions)
// and actions the app doesn't know: there the card lists the changes too
export const sentenceCoversChanges = (action) => Boolean(SENTENCES[action]) && action !== "PROJECT_SETTINGS_CHANGED";

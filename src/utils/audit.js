import {
  AUDIT_ACTIONS,
  AUDIT_ACTION_GROUPS,
  AUDIT_FIELD_LABELS,
  AUDIT_VALUE_LABELS,
  SENSITIVE_FIELD,
} from "../constants/audit.js";

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

// one old or new value as text: role names instead of enum names, "A, B" sets name by name
const formatValue = (value) =>
  String(value)
    .split(", ")
    .map((part) => AUDIT_VALUE_LABELS[part] ?? part)
    .join(", ");

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
        label: AUDIT_FIELD_LABELS[change.field] ?? humanize(change.field),
        kind: hasOld && hasNew ? "changed" : hasNew ? "added" : "removed",
        oldText: hasOld ? formatValue(change.oldValue) : "",
        newText: hasNew ? formatValue(change.newValue) : "",
      };
    });

// long values (project descriptions are free text) are cut for the table; the full text goes in a tooltip
export const truncateText = (text, max = 60) =>
  text.length > max ? { text: `${text.slice(0, max - 1).trimEnd()}…`, truncated: true } : { text, truncated: false };

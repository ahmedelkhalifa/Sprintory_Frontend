import { CHARTER_HISTORY_TYPES, CHARTER_LIMITS, STAKEHOLDER_LEVELS } from "../constants/charter.js";
import { PERMISSIONS } from "../constants/projects.js";
import { can } from "./project.js";
import { isEmptyDoc, toDoc } from "./richText.js";
import { validateEmail } from "./validation.js";

// Project charter helpers (PMP-117, backend project-charter-docs.md). Pure, so they can be unit tested.

const trimmed = (value) => (typeof value === "string" ? value.trim() : "");
// what the backend stores for an optional text: null when blank
const orNull = (value) => trimmed(value) || null;

// keep only the fields that have an error (same shape as the backend's fieldErrors)
const onlyErrors = (errors) => Object.fromEntries(Object.entries(errors).filter(([, message]) => message));

const tooLong = (value, max) => (trimmed(value).length > max ? `Use at most ${max} characters` : "");

// ---------- permissions ----------

// Hiding is only for usability: the backend refuses anyway. The charter's own `canEdit` already covers the
// permission, a completed / archived project and an archived workspace.
export const canEditCharter = (charter) => Boolean(charter?.canEdit) && !charter?.readOnly;

// why the charter is read-only for the caller, or "" when they can edit it
export const charterReadOnlyReason = (charter, project) => {
  if (!charter || canEditCharter(charter)) return "";
  if (!can(project, PERMISSIONS.EDIT_CHARTER)) {
    return project?.template === "SCRUM"
      ? "Only the Project Manager and the Product Owner can edit the charter."
      : "Only the Project Manager can edit the charter.";
  }
  return "This project is completed or archived, or its workspace is archived, so the charter is read-only.";
};

// ---------- goals ----------

export const EMPTY_GOAL = { title: "", successMeasure: "" };

// the form's values for an existing goal (or a new one)
export const goalValues = (goal) => ({ title: goal?.title ?? "", successMeasure: goal?.successMeasure ?? "" });

// title required, at most 200 characters; the success measure is optional, at most 1000
export const validateGoal = (values) => {
  const title = trimmed(values.title);
  return onlyErrors({
    title: !title ? "Title is required" : tooLong(title, CHARTER_LIMITS.GOAL_TITLE),
    successMeasure: tooLong(values.successMeasure, CHARTER_LIMITS.GOAL_MEASURE),
  });
};

export const goalRequest = (values) => ({ title: trimmed(values.title), successMeasure: orNull(values.successMeasure) });

// goals in their manual order (the backend already sends them so; this keeps an optimistic list stable)
export const sortGoals = (goals = []) => [...goals].sort((a, b) => a.order - b.order || a.id - b.id);

// the goals with one moved from `from` to `to`, renumbered 0..n-1 like the backend does
export const moveGoal = (goals, from, to) => {
  if (from === to || from < 0 || to < 0 || from >= goals.length || to >= goals.length) return goals;
  const next = [...goals];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((goal, order) => ({ ...goal, order }));
};

export const goalIds = (goals) => goals.map((goal) => goal.id);

// ---------- scope ----------

// both fields are always sent (a missing one is cleared); an empty document is sent as null
export const scopeRequest = ({ inScope, outOfScope }) => ({
  inScope: isScopeEmpty(inScope) ? null : inScope,
  outOfScope: isScopeEmpty(outOfScope) ? null : outOfScope,
});

export const isScopeEmpty = (value) => !value || isEmptyDoc(toDoc(value));

// ---------- stakeholders ----------

export const EMPTY_STAKEHOLDER = {
  name: "",
  organization: "",
  projectRole: "",
  interest: "",
  influence: "",
  contactEmail: "",
  linkedUser: null, // { userId, label } of a workspace member, or null
};

// the form's values for an existing stakeholder
export const stakeholderValues = (stakeholder) =>
  stakeholder
    ? {
        name: stakeholder.name ?? "",
        organization: stakeholder.organization ?? "",
        projectRole: stakeholder.projectRole ?? "",
        interest: stakeholder.interest ?? "",
        influence: stakeholder.influence ?? "",
        contactEmail: stakeholder.contactEmail ?? "",
        linkedUser:
          stakeholder.linkedUserId != null
            ? { userId: stakeholder.linkedUserId, label: stakeholder.linkedUserName || `User ${stakeholder.linkedUserId}` }
            : null,
      }
    : { ...EMPTY_STAKEHOLDER };

// name required; the rest optional, with the backend's lengths; the email must look like an email
export const validateStakeholder = (values) => {
  const name = trimmed(values.name);
  const email = trimmed(values.contactEmail);
  return onlyErrors({
    name: !name ? "Name is required" : tooLong(name, CHARTER_LIMITS.STAKEHOLDER_NAME),
    organization: tooLong(values.organization, CHARTER_LIMITS.STAKEHOLDER_ORGANIZATION),
    projectRole: tooLong(values.projectRole, CHARTER_LIMITS.STAKEHOLDER_ROLE),
    contactEmail: !email ? "" : validateEmail(email) || tooLong(email, CHARTER_LIMITS.STAKEHOLDER_EMAIL),
  });
};

const level = (value) => (STAKEHOLDER_LEVELS.includes(value) ? value : null);

export const stakeholderRequest = (values) => ({
  name: trimmed(values.name),
  organization: orNull(values.organization),
  projectRole: orNull(values.projectRole),
  interest: level(values.interest),
  influence: level(values.influence),
  contactEmail: orNull(values.contactEmail),
  linkedUserId: values.linkedUser?.userId ?? null,
});

// the word to search the workspace members by: their search matches first name, last name or email one at a time
export const memberSearchTerm = (name) => trimmed(name).split(/\s+/)[0] ?? "";

// ---------- history ----------

// a goal snapshot in the history ({ id, title, successMeasure, order }); null when missing or not JSON
export const parseGoalSnapshot = (value) => {
  if (!value) return null;
  try {
    const goal = JSON.parse(value);
    return goal && typeof goal === "object" && !Array.isArray(goal) ? goal : null;
  } catch {
    return null;
  }
};

// a GOALS_REORDERED value: a JSON array of goal ids
export const parseGoalOrder = (value) => {
  try {
    const ids = JSON.parse(value);
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
};

// goal titles by id, for naming goals in a reorder: the current goals win, older snapshots fill in deleted ones
export const goalTitles = (entries = [], goals = []) => {
  const titles = new Map();
  for (const entry of entries) {
    for (const value of [entry.oldValue, entry.newValue]) {
      const goal = parseGoalSnapshot(value);
      if (goal?.id != null && goal.title && !titles.has(goal.id)) titles.set(goal.id, goal.title);
    }
  }
  for (const goal of goals) titles.set(goal.id, goal.title);
  return titles;
};

const orderText = (ids, titles) => ids.map((id, i) => `${i + 1}. ${titles.get(id) ?? `Goal #${id}`}`).join("\n");

/**
 * One charter history entry in words: { text, changes: [{ label, from, to, rich }] }.
 * `text` follows the actor's name ("added the goal “X”"); each change is an old → new pair (null = none).
 * `rich` marks TipTap JSON strings (scope) that must be drawn with RichText, never as HTML.
 */
export const charterHistoryLine = (entry, titles = new Map()) => {
  const before = parseGoalSnapshot(entry.oldValue);
  const after = parseGoalSnapshot(entry.newValue);
  switch (entry.changeType) {
    case CHARTER_HISTORY_TYPES.GOAL_ADDED:
      return {
        text: `added the goal “${after?.title ?? "Untitled"}”`,
        changes: after?.successMeasure ? [{ label: "Success measure", from: null, to: after.successMeasure }] : [],
      };
    case CHARTER_HISTORY_TYPES.GOAL_UPDATED: {
      const changes = [];
      if (before?.title !== after?.title) changes.push({ label: "Title", from: before?.title ?? null, to: after?.title ?? null });
      if ((before?.successMeasure ?? null) !== (after?.successMeasure ?? null)) {
        changes.push({ label: "Success measure", from: before?.successMeasure ?? null, to: after?.successMeasure ?? null });
      }
      return { text: `updated the goal “${after?.title ?? before?.title ?? "Untitled"}”`, changes };
    }
    case CHARTER_HISTORY_TYPES.GOAL_DELETED:
      return {
        text: `deleted the goal “${before?.title ?? "Untitled"}”`,
        changes: before?.successMeasure ? [{ label: "Success measure", from: before.successMeasure, to: null }] : [],
      };
    case CHARTER_HISTORY_TYPES.GOALS_REORDERED:
      return {
        text: "reordered the goals",
        changes: [
          {
            label: "Order",
            from: orderText(parseGoalOrder(entry.oldValue), titles),
            to: orderText(parseGoalOrder(entry.newValue), titles),
          },
        ],
      };
    case CHARTER_HISTORY_TYPES.IN_SCOPE_CHANGED:
      return { text: "changed In scope", changes: [{ label: "In scope", from: entry.oldValue ?? null, to: entry.newValue ?? null, rich: true }] };
    case CHARTER_HISTORY_TYPES.OUT_OF_SCOPE_CHANGED:
      return {
        text: "changed Out of scope",
        changes: [{ label: "Out of scope", from: entry.oldValue ?? null, to: entry.newValue ?? null, rich: true }],
      };
    default:
      return { text: "changed the charter", changes: [] };
  }
};

// a VALIDATION_ERROR's fieldErrors, mapped onto a form's fields; null for any other error
export const charterFieldErrors = (err, fields) => {
  const data = err?.response?.data;
  if (data?.code !== "VALIDATION_ERROR" || !data.fieldErrors) return null;
  const errors = Object.fromEntries(fields.filter((field) => data.fieldErrors[field]).map((field) => [field, data.fieldErrors[field]]));
  return Object.keys(errors).length ? errors : null;
};

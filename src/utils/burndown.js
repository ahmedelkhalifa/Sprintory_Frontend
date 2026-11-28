const STORAGE_KEY = "sprintory.burndownOptions";

export const UNIT_OPTIONS = [
  { value: "points", label: "Story points" },
  { value: "tasks", label: "Task count" },
];

export const DAY_OPTIONS = [
  { value: "working", label: "Working days only" },
  { value: "calendar", label: "Calendar days" },
];

export const DEFAULT_OPTIONS = { unit: "points", days: "working" };

const pick = (options, value, fallback) =>
  options.some((option) => option.value === value) ? value : fallback;

// storage can be blocked or hold garbage, so every read falls back to the defaults
export const loadOptions = () => {
  try {
    const saved = JSON.parse(globalThis.localStorage.getItem(STORAGE_KEY));
    return {
      unit: pick(UNIT_OPTIONS, saved?.unit, DEFAULT_OPTIONS.unit),
      days: pick(DAY_OPTIONS, saved?.days, DEFAULT_OPTIONS.days),
    };
  } catch {
    return DEFAULT_OPTIONS;
  }
};

export const saveOptions = (options) => {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  } catch {
    // the choice then lasts until the page is left
  }
};

const completedTime = (sprint) => Date.parse(sprint.completedAt) || 0;

// the active sprint first, then ended ones, latest first; planned ones are never offered
export const startedSprints = (current, history) => [
  ...current.filter((sprint) => sprint.status === "ACTIVE"),
  ...history
    .filter((sprint) => sprint.status === "COMPLETED" || sprint.status === "CANCELLED")
    .sort((a, b) => completedTime(b) - completedTime(a)),
];

// index is the x value: the Start point and the first day share a date
export const chartRows = ({ dates, ideal, actual, scopeChanges }) =>
  dates.map((date, index) => ({
    index,
    date,
    ideal: ideal[index],
    actual: actual[index],
    scopeChange: scopeChanges[index],
  }));

export const isWeekend = (date) => {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
};

// a day's value is its end, so day i covers the stretch from i - 1 to i
export const weekendBands = (dates) =>
  dates.flatMap((date, index) => (index > 0 && isWeekend(date) ? [{ from: index - 1, to: index }] : []));

export const todayIndex = (dates, today) => {
  const index = dates.lastIndexOf(today);
  return index > 0 ? index : null;
};

const dayFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export const dayLabel = (dates, index) => {
  if (index === 0) return "Start";
  return dates[index] ? dayFormat.format(new Date(`${dates[index]}T00:00:00Z`)) : "";
};

export const formatAmount = (value) => (value == null ? "—" : String(Math.round(value * 100) / 100));

export const signed = (value) => `${value > 0 ? "+" : "−"}${formatAmount(Math.abs(value))}`;

// null when there is nothing to say
export const scopeChangeText = (change, unit) => {
  if (!change) return null;
  const one = Math.abs(change) === 1;
  const word = unit === "TASKS" ? (one ? "task" : "tasks") : one ? "pt" : "pts";
  return `${signed(change)} ${word}`;
};

export const unestimatedText = (count) =>
  count === 1
    ? "1 task has no estimate and is not counted"
    : `${count} tasks have no estimate and are not counted`;

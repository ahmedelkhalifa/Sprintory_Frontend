// TEMP placeholder data for the project overview, until the backend has tasks and an activity feed.
// Not real: the numbers are made up, but stay the same for a project (seeded by its id),
// and the activity uses the project's real members' names so it reads naturally.
// Delete this folder when the tasks / activity APIs exist, and load the real data instead.

// small deterministic random numbers from a seed, so a project always shows the same placeholder data
const seeded = (seed) => {
  let value = Number(seed) * 9301 + 49297;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
};

/**
 * { total, completed, inProgress, onHold, totalChange, trend } for the four stat cards.
 * totalChange is the % change vs last week; trend is 8 points for the small line chart.
 */
export function placeholderStats(project) {
  const random = seeded(project.id);
  const total = 12 + Math.floor(random() * 30);
  const completed = Math.floor(total * (0.3 + random() * 0.4));
  const onHold = Math.floor((total - completed) * random() * 0.3);
  const inProgress = total - completed - onHold;
  const trend = Array.from({ length: 8 }, (_, i) => Math.round(total * (0.55 + i * 0.06 + random() * 0.08)));
  return { total, completed, inProgress, onHold, totalChange: 4 + Math.floor(random() * 15), trend };
}

const TASKS = ["Design mobile layout issues", "API integration", "Setup project structure", "Fix mobile layout issues",
  "Write onboarding copy", "Login error handling", "Dashboard charts", "Release checklist"];
const EVENTS = [
  { verb: "created a new task", status: "TODO" },
  { verb: "added a comment on", status: "IN_PROGRESS" },
  { verb: "moved", suffix: "to In Progress", status: "IN_PROGRESS" },
  { verb: "uploaded a file", file: true, status: "REVIEW" },
  { verb: "completed", status: "DONE" },
];
const HOURS_AGO = [2, 4, 6, 26, 30];

/**
 * The 5 latest activity items: { id, person, verb, target, suffix, status, at }.
 * `members` are the project's members (any shape with firstName/lastName); with none, the list is empty.
 */
export function placeholderActivity(project, members, now = Date.now()) {
  if (members.length === 0) return [];
  const random = seeded(project.id + 7);
  return EVENTS.map((event, i) => {
    const task = TASKS[Math.floor(random() * TASKS.length)];
    return {
      id: `${project.id}-${i}`,
      person: members[Math.floor(random() * members.length)],
      verb: event.verb,
      target: event.file ? `${task.toLowerCase().replaceAll(" ", "-")}.fig` : task,
      suffix: event.suffix,
      status: event.status,
      at: new Date(now - HOURS_AGO[i] * 60 * 60 * 1000).toISOString(),
    };
  });
}

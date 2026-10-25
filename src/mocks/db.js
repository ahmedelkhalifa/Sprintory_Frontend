// Fake backend data, used only when VITE_USE_MOCKS=true. Delete src/mocks/ once the backend is connected.
// Shapes follow projects-docs.md, workspaces-docs.md, teams-docs.md and roles-docs.md.
// Project `key` and `status` are ASSUMED (story 8 / R30), see the ASSUMED section in src/api/projectsApi.js.
// The data lives in memory: changes (create, edit, archive, add/remove people) last until the page is reloaded.

// TEMP test switches: change them to see the pages as a plain member or in an archived workspace
export const MOCK_ROLE = "WORKSPACE_ADMIN"; // "WORKSPACE_ADMIN" | "WORKSPACE_MEMBER"
export const MOCK_ARCHIVED = false;

// the logged-in user
export const ME = 1;

const FIRST_NAMES = ["Mobeen", "Alex", "Sarah", "Jordan", "Priya", "Daniel", "Damir", "Lina", "Omar", "Grace",
  "Ada", "Linus", "Maya", "Noah", "Zara", "Ethan", "Layla", "Lucas", "Huda", "Ivan",
  "Sofia", "Karim", "Mila", "Yusuf", "Elena", "Tariq", "Nora", "Felix", "Amira", "Leo"];
const LAST_NAMES = ["Adil", "Morgan", "Chen", "Davis", "Sharma", "Kim", "Usmanov", "Haddad", "Farouk", "Hopper",
  "Lovelace", "Torvalds", "Patel", "Brown", "Ali", "Clark", "Hassan", "Silva", "Saleh", "Petrov",
  "Rossi", "Nasser", "Novak", "Demir", "Popescu", "Aziz", "Jensen", "Weber", "Khalil", "Moreau"];

// 30 people, so the "Add people" picker has more than one page
export const users = FIRST_NAMES.map((firstName, i) => ({
  id: i + 1,
  firstName,
  lastName: LAST_NAMES[i],
  email: `${firstName}.${LAST_NAMES[i]}`.toLowerCase() + "@sprintory.com",
}));

export const workspaces = [
  { id: 3, name: "Sprintory Company", slug: "sprintory-company", archivedAt: MOCK_ARCHIVED ? "2026-10-20T09:00:00Z" : null },
  // sorts after "Sprintory Company", so the main workspace is the default one
  { id: 4, name: "Weekend Projects", slug: "weekend-projects", archivedAt: null },
];

// [workspaceId, userId, role]: everyone is in workspace 3, only a few in workspace 4
export const workspaceMembers = [
  ...users.map((u) => [3, u.id, u.id === ME ? MOCK_ROLE : "WORKSPACE_MEMBER"]),
  [4, ME, "WORKSPACE_MEMBER"], [4, 2, "WORKSPACE_ADMIN"], [4, 3, "WORKSPACE_MEMBER"],
];

export const teams = [
  { id: 1, workspaceId: 3, name: "Backend", members: [2, 6, 7, 20] },
  { id: 2, workspaceId: 3, name: "Design", members: [8, 13, 21] },
  { id: 3, workspaceId: 3, name: "Frontend", members: [1, 2, 4] },
  { id: 4, workspaceId: 3, name: "Quality Assurance", members: [9, 14, 15, 25, 26] },
  { id: 5, workspaceId: 4, name: "Weekend Hackers", members: [1, 3] },
];

// ASSUMED key rule: initials of the words ("Website Redesign" → "WR"), or the first 3 letters of a
// single word ("Analytics" → "ANA"), with a number added when the key is taken in the workspace
export const makeKey = (name, takenKeys) => {
  const words = name.toUpperCase().match(/[A-Z0-9]+/g) ?? ["P"];
  const base = words.length > 1 ? words.map((w) => w[0]).join("").slice(0, 4) : words[0].slice(0, 3);
  let key = base;
  for (let n = 2; takenKeys.includes(key); n++) key = `${base}${n}`;
  return key;
};

const PROJECT_NAMES = ["Sprintory Platform", "Mobile App", "Website & Marketing", "Design System", "Backend Services",
  "Analytics", "Billing", "Notifications", "Search", "Onboarding", "Admin Console", "Public API", "Integrations",
  "Help Center", "Reporting", "Data Pipeline", "Security Audit", "Performance", "Accessibility", "Localization",
  "Customer Portal", "Partner Program"];
const ARCHIVED_PROJECTS = [6, 14, 19];

// 22 projects in workspace 3 (more than one page), 1 in workspace 4; every third one is Kanban
export const projects = [];
[...PROJECT_NAMES.map((name, i) => ({ id: i + 1, workspaceId: 3, name })), { id: 50, workspaceId: 4, name: "Hackathon Bot" }]
  .forEach((p) => {
    const takenKeys = projects.filter((other) => other.workspaceId === p.workspaceId).map((other) => other.key);
    projects.push({
      ...p,
      template: p.id % 3 === 0 ? "KANBAN" : "SCRUM",
      key: makeKey(p.name, takenKeys),
      status: ARCHIVED_PROJECTS.includes(p.id) ? "ARCHIVED" : "ACTIVE",
    });
  });

// my roles in a project: Project Manager in some, Product Owner + Scrum Master (Scrum only) in some, Developer elsewhere
const myRoles = (projectId) => {
  if (projectId % 3 === 0) return ["PROJECT_MANAGER"];
  if (projectId % 5 === 0) return ["PRODUCT_OWNER", "SCRUM_MASTER"];
  return ["MEMBER"];
};

// project id -> [{ userId, roles }]. Mobeen (ME) is in most projects but not all,
// so a plain member sees fewer projects than an admin. Every project has a Project Manager.
export const projectMembers = Object.fromEntries(
  projects.map((p) => {
    if (p.workspaceId === 4) return [p.id, [{ userId: ME, roles: ["PROJECT_MANAGER"] }, { userId: 3, roles: ["MEMBER"] }]];

    const size = 3 + (p.id % 6);
    const others = [...new Set(Array.from({ length: size }, (_, k) => ((p.id * 7 + k * 5) % users.length) + 1))]
      .filter((id) => id !== ME);
    const meIn = p.id % 4 !== 0;
    const iAmManager = meIn && myRoles(p.id).includes("PROJECT_MANAGER");

    const list = others.map((userId, i) => ({ userId, roles: !iAmManager && i === 0 ? ["PROJECT_MANAGER"] : ["MEMBER"] }));
    if (meIn) list.push({ userId: ME, roles: myRoles(p.id) });
    return [p.id, list];
  }),
);

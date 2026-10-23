// Fake data used while the backend isn't ready (only when VITE_USE_MOCKS=true).
// Same shapes as the real API, see the contract in src/api/projectsApi.js.
// Delete this folder once the backend is connected.

const PEOPLE = [
  { id: 1, firstName: "Mobeen", lastName: "Adil", email: "mobeen@sprintory.com", avatarUrl: null },
  { id: 2, firstName: "Alex", lastName: "Morgan", email: "alex@sprintory.com", avatarUrl: null },
  { id: 3, firstName: "Sarah", lastName: "Chen", email: "sarah@sprintory.com", avatarUrl: null },
  { id: 4, firstName: "Jordan", lastName: "Davis", email: "jordan@sprintory.com", avatarUrl: null },
  { id: 5, firstName: "Priya", lastName: "Sharma", email: "priya@sprintory.com", avatarUrl: null },
  { id: 6, firstName: "Daniel", lastName: "Kim", email: "daniel@sprintory.com", avatarUrl: null },
  { id: 7, firstName: "Damir", lastName: "Usmanov", email: "damir@sprintory.com", avatarUrl: null },
  { id: 8, firstName: "Lina", lastName: "Haddad", email: "lina@sprintory.com", avatarUrl: null },
];

// members of each project: [personId, role, joinedAt]
const MEMBERSHIPS = {
  1: [[1, "OWNER", "2026-01-05"], [2, "ADMIN", "2026-02-02"], [3, "MEMBER", "2026-03-09"], [4, "MEMBER", "2026-03-15"], [5, "MEMBER", "2026-04-01"], [6, "MEMBER", "2026-05-20"], [7, "MEMBER", "2026-06-11"]],
  2: [[3, "OWNER", "2026-02-10"], [5, "ADMIN", "2026-02-12"], [8, "MEMBER", "2026-04-22"]],
  3: [[4, "OWNER", "2026-03-01"], [1, "ADMIN", "2026-03-02"], [6, "MEMBER", "2026-03-20"], [2, "MEMBER", "2026-04-05"], [7, "MEMBER", "2026-07-08"]],
  4: [[2, "OWNER", "2026-01-20"], [3, "MEMBER", "2026-02-01"], [8, "MEMBER", "2026-05-14"], [5, "MEMBER", "2026-06-30"]],
  5: [[6, "OWNER", "2026-04-18"], [7, "ADMIN", "2026-04-19"], [1, "MEMBER", "2026-05-03"], [4, "MEMBER", "2026-08-12"]],
  6: [[5, "OWNER", "2026-06-01"]],
};

const PROJECTS = [
  { id: 1, key: "SPR", name: "Sprintory Platform", description: "Core platform development.", updatedAt: "2026-10-20" },
  { id: 2, key: "WEB", name: "Website & Marketing", description: "Landing page and marketing tools.", updatedAt: "2026-10-18" },
  { id: 3, key: "MOB", name: "Mobile App", description: "iOS and Android application.", updatedAt: "2026-10-15" },
  { id: 4, key: "DSN", name: "Design System", description: "UI components and design guidelines.", updatedAt: "2026-10-14" },
  { id: 5, key: "API", name: "Backend Services", description: "APIs and infrastructure.", updatedAt: "2026-10-12" },
  { id: 6, key: "ANL", name: "Analytics", description: "Product analytics and monitoring.", updatedAt: "2026-10-10" },
];

const membersOf = (projectId) =>
  (MEMBERSHIPS[projectId] ?? []).map(([personId, role, joinedAt]) => ({
    ...PEOPLE.find((person) => person.id === personId),
    role,
    joinedAt,
  }));

// looks like an axios 404, so the hooks handle it the same way as a real one
const notFound = () => Object.assign(new Error("Not found"), { response: { status: 404 } });

// small delay so loading states are visible, like a real request
const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 400));

export const mockGetProjects = () =>
  delay(
    PROJECTS.map((project) => {
      const members = membersOf(project.id);
      return { ...project, memberCount: members.length, membersPreview: members.slice(0, 3) };
    }),
  );

export const mockGetProject = async (projectId) => {
  const project = PROJECTS.find((p) => String(p.id) === String(projectId));
  await delay();
  if (!project) throw notFound();
  return project;
};

export const mockGetProjectMembers = async (projectId) => {
  await delay();
  if (!MEMBERSHIPS[projectId]) throw notFound();
  return membersOf(projectId);
};

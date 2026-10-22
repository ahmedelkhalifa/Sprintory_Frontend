// Local-only example data for the Teams UI. Replace with the workspace API later.
// No account, permission, or invite state is inferred from these examples.
export const demoMembers = [
  { id: "member-1", name: "Alex Morgan", email: "alex@example.com" },
  { id: "member-2", name: "Sarah Chen", email: "sarah@example.com" },
  { id: "member-3", name: "Jordan Davis", email: "jordan@example.com" },
  { id: "member-4", name: "Priya Sharma", email: "priya@example.com" },
  { id: "member-5", name: "Daniel Kim", email: "daniel@example.com" },
  { id: "member-6", name: "Maya Patel", email: "maya@example.com" },
  { id: "member-7", name: "Noah Brown", email: "noah@example.com" },
  { id: "member-8", name: "Lena Fischer", email: "lena@example.com" },
  { id: "member-9", name: "Sam Rivera", email: "sam@example.com" },
  { id: "member-10", name: "Emma Wilson", email: "emma@example.com" },
];

export const demoProjects = [
  { id: "project-1", name: "Sprintory Platform", detail: "Core product experience", status: "In progress" },
  { id: "project-2", name: "Authentication", detail: "Identity and access", status: "In progress" },
  { id: "project-3", name: "Team Management", detail: "Workspaces and teams", status: "Planning" },
  { id: "project-4", name: "Mobile Experience", detail: "Responsive product design", status: "Review" },
  { id: "project-5", name: "Integrations API", detail: "External services", status: "Planning" },
];

// "My teams" uses this fictional member in preview mode, not the authenticated user.
export const demoCurrentMemberId = "member-1";

export const demoTeams = [
  {
    id: "team-1",
    name: "Product Development",
    description: "Core product development team responsible for new features and platform improvements.",
    members: ["member-1", "member-2", "member-3", "member-4", "member-5"],
    projects: ["project-1", "project-2", "project-3"],
  },
  {
    id: "team-2",
    name: "Design",
    description: "Product design, user research, and the visual experience of Sprintory.",
    members: ["member-2", "member-4", "member-6", "member-8"],
    projects: ["project-1", "project-4"],
  },
  {
    id: "team-3",
    name: "Backend",
    description: "Backend services, APIs, data models, and application infrastructure.",
    members: ["member-1", "member-3", "member-5", "member-7", "member-9"],
    projects: ["project-1", "project-2", "project-5"],
  },
  {
    id: "team-4",
    name: "Frontend",
    description: "Frontend development, reusable components, and responsive interfaces.",
    members: ["member-1", "member-2", "member-6", "member-10"],
    projects: ["project-1", "project-3", "project-4"],
  },
  {
    id: "team-5",
    name: "Quality Assurance",
    description: "Automated testing, regression coverage, and product quality.",
    members: ["member-3", "member-7", "member-8", "member-9"],
    projects: ["project-1", "project-2"],
  },
  {
    id: "team-6",
    name: "Product Management",
    description: "Product direction, planning, delivery coordination, and feedback.",
    members: ["member-4", "member-6", "member-10"],
    projects: ["project-1", "project-3"],
  },
];

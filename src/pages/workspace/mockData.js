export const WORKSPACE = {
    name: "Sprintory Platform",
    role: "Owner",
    description: "Main workspace for Sprintory product development and team collaboration.",
};

export const STATS = [
    { key: "projects", value: 12, label: "Projects" },
    { key: "teams", value: 5, label: "Teams" },
    { key: "members", value: 28, label: "Members" },
    { key: "active", value: 4, label: "Active this week" },
];

// tone: имя цвета из палитры темы (primary | success | warning | error | secondary)
export const PROJECTS = [
    { code: "SP", name: "Sprintory Platform", desc: "Core platform development.", status: "In Progress", team: "Product Development", members: 7, updated: "Oct 20, 2026", tone: "primary" },
    { code: "WE", name: "Website & Marketing", desc: "Landing page and marketing tools.", status: "In Progress", team: "Growth", members: 5, updated: "Oct 18, 2026", tone: "secondary" },
    { code: "MO", name: "Mobile App", desc: "iOS and Android application.", status: "Planning", team: "Product Development", members: 6, updated: "Oct 15, 2026", tone: "secondary" },
    { code: "DE", name: "Design System", desc: "UI components and design guidelines.", status: "In Progress", team: "Design", members: 5, updated: "Oct 14, 2026", tone: "secondary" },
    { code: "BA", name: "Backend Services", desc: "APIs and infrastructure.", status: "In Progress", team: "Backend", members: 6, updated: "Oct 12, 2026", tone: "warning" },
    { code: "AN", name: "Analytics", desc: "Product analytics and monitoring.", status: "On Hold", team: "Data", members: 3, updated: "Oct 10, 2026", tone: "success" },
    { code: "QA", name: "Quality Assurance", desc: "Testing and quality processes.", status: "Planning", team: "QA", members: 5, updated: "Oct 09, 2026", tone: "error" },
    { code: "HR", name: "HR & Operations", desc: "Internal tools and documentation.", status: "Not Started", team: "Operations", members: 3, updated: "Oct 05, 2026", tone: "secondary" },
];

export const TEAMS = [
    { code: "PD", name: "Product Development", members: 8 },
    { code: "DS", name: "Design", members: 6 },
    { code: "BE", name: "Backend", members: 5 },
    { code: "FE", name: "Frontend", members: 4 },
    { code: "QA", name: "Quality Assurance", members: 4 },
];

export const ACTIVITY = [
    { initials: "AM", who: "Alex Morgan", what: "updated project status", target: "Sprintory Platform", when: "2h ago" },
    { initials: "SC", who: "Sarah Chen", what: "added a new member", target: "Design", when: "5h ago" },
    { initials: "JD", who: "Jordan Davis", what: "created a new project", target: "Mobile App", when: "1d ago" },
    { initials: "PS", who: "Priya Sharma", what: "updated project details", target: "Website & Marketing", when: "1d ago" },
    { initials: "DK", who: "Daniel Kim", what: "commented", target: "Backend Services", when: "2d ago" },
];

// Цвет из палитры по имени тона
export const toneColor = (theme, tone) =>
    tone === "neutral" || tone === "secondary"
        ? theme.palette.secondary.main
        : theme.palette[tone].main;
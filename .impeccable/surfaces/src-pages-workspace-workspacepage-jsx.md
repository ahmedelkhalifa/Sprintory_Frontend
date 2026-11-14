---
version: 1
slug: "src-pages-workspace-workspacepage-jsx"
primary_target: "src/pages/workspace/WorkspacePage.jsx"
related_targets: ["src/components/layouts/AppShell.jsx"]
---

Scope: the app shell (top bar, sidebar) and the workspace home page. Mode: Operate. Audience: student and small software teams who know Jira; job: see what I own, what sprints are running, and get to a project.

## Direction contract

THESIS: The category standard played straight and finished to Jira's own bar: a calm white work surface where only state and the one blue carry colour. It refuses the template dashboard: stat-card rows, icon tiles, tinted panels, pill chips and rounded-everything.

OWN-WORLD: White top bar with a hairline, light-gray (#F7F8F9) sidebar, white content. Ink #172B4D, secondary #44546F, hairlines #DFE1E6. One blue (#0C66E4) for primary actions, links, focus and the selected nav item only. 3px corners, no card shadows, overlays with a soft layered shadow. System sans, 14px body, 12px uppercase lozenges for status. Dark mode mirrors it on #1D2125.

STORY: The visitor lands, sees the tasks assigned to them across projects and how many days each running sprint has left, then opens a task, a board or a project. Sprintory's own structure stays: collapsible rail, sprint day-strip, Scrum/Kanban vocabulary.

FIRST VIEWPORT: 56px white bar (rail toggle, bolt logo, search, bell, account). Rail on the left. Title row: workspace name, role and member count, actions right. Main column: Assigned to me table (key, summary, project, status lozenge, priority). Side column: Active sprints with a day-strip (one cell per day, today outlined, overdue red). Below: Projects table and Teams list. Content fills the width the rail frees.

FORM: canon (the category standard), chosen by the user over the rolled Semester Timetable; seed: 86188b24a4f75090. Craft bar: Jira Cloud and Linear. Motion per Emil Kowalski: 150–200ms ease-out, exits faster than entries, no load choreography, reduced motion respected.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

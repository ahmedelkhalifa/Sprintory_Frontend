# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Student software teams** running a course project (built during a Software Analysis & Design course) with Scrum or Kanban: a Product Owner, a Scrum Master and developers, or a Kanban team, planning and tracking real work across a semester.
- **Small professional software teams** who want a Jira-like tool without Jira's configuration weight.

Both are served as a real product: people open it daily to see what they own, plan sprints, move work on the board and talk about it.

## Product Purpose

Sprintory is a project management tool for software teams. A workspace holds people, teams and projects; each project is Scrum or Kanban and carries its board, backlog, sprints, tasks with subtasks, comments, mentions, history, attachments, a project charter and a live project chat. Success: a team runs its whole project in Sprintory, following its methodology correctly, without leaving for chat or documents elsewhere.

## Positioning

- **Methodologies done the way they're defined.** Scrum has real roles (Product Owner, Scrum Master, Developers), sprint planning with capacity and availability, a required sprint goal, and completing or cancelling a sprint with a goal answer and carried-over work. Kanban has its own board with WIP limits and no sprints.
- **Simple for small teams.** Sensible defaults from the template instead of configuration.
- **All in one place.** Charter (goals, scope, stakeholders), chat, board, backlog, sprints and task history live together per project.
- **Familiar to Jira users.** It should feel like Jira to use (navigation, boards, backlog, task pages), while adding what Jira splits out.

## Operating Context

Workspaces with admin / member roles; projects with template-specific roles and permissions; Scrum backlog → sprint → board → complete/cancel sprint; Kanban board with WIP limits; task drawer and full task page; @mentions in descriptions, comments and chat; notifications (in-app live + email); universal search; workspace audit log for admins; invitations by email; Google sign-in.

## Capabilities and Constraints

- Frontend: React 19 + Vite, MUI v9, plain JavaScript; Spring backend owns every `/api/v1` contract (summaries in `dev-docs/`).
- Light and dark mode on every page; all colours come from theme tokens.
- Attachments backend not built yet (PMP-141); some project status endpoints are assumed (`dev-docs/projects.md`).
- No activity feed or "my work" endpoint yet; cross-project views must be assembled from per-project calls.

## Brand Commitments

- Name **Sprintory**, with the bolt mark (`src/components/general/Logo.jsx`, a placeholder until the real logo SVG exists).
- Feels like Jira to use; Scrum and Kanban terminology used exactly (e.g. "Complete sprint", "Developer" for MEMBER in Scrum).
- Visual language: the category standard (Jira-like), chosen by the user on 2026-11-11, executed at full craft while keeping Sprintory's own structure (collapsible rail, sprint day-strip). Craft bar: Jira Cloud, Linear.

## Evidence on Hand

No real customers, testimonials, usage metrics or benchmarks. None may be invented; sample content must never be presented as real activity.

## Product Principles

1. The methodology is the product: screens follow how Scrum and Kanban actually work, not a generic task list.
2. Show real work first: what I own, what the team is committed to, what is at risk.
3. Familiar before novel: standard navigation and controls a Jira user already knows.
4. One place per project: no detours to other tools for the charter, the conversation or the history.
5. Honest states: loading, empty and failure are shown as what they are.

## Accessibility & Inclusion

WCAG 2.1 AA contrast in both colour modes; keyboard-reachable controls; reduced-motion respected.

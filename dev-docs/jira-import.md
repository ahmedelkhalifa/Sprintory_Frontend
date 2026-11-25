# One-time Jira CSV import (Sprintory)

This feature provides a **one-time Jira → Sprintory project migration**, not synchronization. New tasks created or changed in Jira later are **not** synchronized into existing Sprintory tasks. The backend contract and import limitations are in `Sprintory_Backend/docs/jira-import-docs.md`.

## Where it appears

Project → Settings → Import from Jira (`settings/jira-import`). The menu item is available only when:

- `VITE_ENABLE_JIRA_IMPORT=true` was set at **frontend build time**;
- the project uses **Scrum** and is writable;
- the current user has `EDIT_SETTINGS`, `EDIT_TASKS`, `CONFIGURE_BOARD`, and `VIEW_WORK` permissions;
- the workspace is not archived.

**Security:** this UI gating is not authorization. The backend validates access on every endpoint and requires `SPRINTORY_JIRA_IMPORT_ENABLED=true` before accepting requests. Both flags should be disabled again after cutover.

## User workflow

1. Create a **new, empty Scrum project** and confirm intended workspace/project key.
2. Open the collapsible export guide for screenshots of Jira Basic search and CSV export. Upload a Jira issues CSV (all fields); optionally provide sprint metadata JSON. The guide generates a sprint export URL from a Jira Cloud board address, opens it in a new tab, and never handles Jira tokens or directly fetches Jira data. Preview the counts, skipped items, blockers and limitations.
   - Jira CSV exports are limited to 1,000 work items. Larger projects are not supported; the one-time importer does not combine split exports.
   - Sprint exports require a Scrum board and include up to 50 sprints. If the board has more, import without sprints.
   - Without JSON, imported top-level items go into the backlog with their original statuses and no sprint assignments. A warning is visible before import. Sprint assignments cannot be added later by re-importing.
   - The backend rejects incomplete sprint pages or invalid supplied JSON. To recover, choose a complete JSON file or remove it and import without sprints.
3. Optionally match Jira assignees with Sprintory project members. Unmatched issues remain unassigned.
4. Type `IMPORT` to confirm the one-time migration.
5. Check sprints, parent-child task relationships, board columns and descriptions. Download the issue mapping for audit.
6. Repeating the **same exact import** should create no duplicates. Do not rely on this feature to update previously imported issues or to append new Jira work to the migrated project.

The importer is not intended for migrating into an already-populated destination. It intentionally excludes unsupported Jira data such as Epic hierarchy and attachment binaries; consult the preview and backend contract before migration.

## Frontend API

- `POST /projects/{projectId}/jira-import/preview` — preview (multipart CSV + optional sprint JSON).
- `POST /projects/{projectId}/jira-import` — execute with confirmation and mapping.
- `GET /projects/{projectId}/jira-import/mappings` — download Jira-to-Sprintory references.

## Deployment and rollback

Build frontend with `VITE_ENABLE_JIRA_IMPORT=true` **only** for an approved migration window; enable the backend flag in the same window. Keep a database backup before importing real Jira data. Disable both flags afterward. Disabling the importer prevents further imports without affecting previously imported tasks.

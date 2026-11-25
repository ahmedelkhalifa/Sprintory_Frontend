# Sprint retrospectives

Source: `sprintory_backend/docs/retrospectives-docs.md` (R31, PMP-44), as of 25 Nov 2026. The backend (PMP-147) is complete on its branch `features/retrospectives`, **not in its main yet**; the frontend (PMP-148) was built with a fake backend and still has to be tested against the real one. Shared rules are in [README.md](README.md).

## Basics

- **Scrum only**, one retro per sprint, only after the sprint ended (`COMPLETED` or `CANCELLED`). No deadline.
- `OPEN` as soon as it exists → `CLOSED` (read-only, never reopened). No rename, no delete, title fixed ("<sprint name> Retrospective").
- Three fixed columns: `WENT_WELL`, `TO_IMPROVE`, `IDEAS`. Cards have a named author and rich text with @mentions, at most 1,000 characters; a card's column never changes.
- 3 votes per person per retro, at most 1 per card. Deleting a card gives its votes back.
- An action is a **real task** (type `TASK`, label `retro-action`). The retro keeps only the link, so its title, status, owner and sprint are always the task's own; a deleted task has only its `id` and `key` left (`deleted: true`).
- A retro also shows the unfinished actions of the project's most recent earlier retro (`previousActions`, `null` when there are none).
- **Not real-time.** An archived workspace (`409 WORKSPACE_ARCHIVED`) or a completed / archived project (`409 CONFLICT`) is read-only.

## Who may

| | Permission | Roles |
| --- | --- | --- |
| Read | `VIEW_WORK` | every project role (a workspace admin outside the project: `403`) |
| Add a card, vote, edit / delete the own card | `RETRO_CONTRIBUTE` | everyone but Viewers |
| Create, close, make actions, delete anyone's card | `RETRO_MANAGE` | Scrum Master, Product Owner, Project Manager |

On the board use the response's `canContribute` / `canManage` and each card's `canEdit` / `canDelete`: they also know whether the retro is open and the project writable. Nobody but its author edits a card.

## Endpoints

In the frontend: [retrosApi.js](../src/api/retrosApi.js), which also lists the response fields.

| Action | Method and path | Success |
| --- | --- | --- |
| Create or open (`openRetro`) | `POST /sprints/{sprintId}/retro` | `201` created, `200` already there: the same retro either way |
| Read the whole board (`getRetro`) | `GET /retros/{retroId}` | `200` |
| Add a card (`createRetroItem`) | `POST /retros/{retroId}/items` `{ column, body }` | `201` the card |
| Edit a card (`updateRetroItem`) | `PATCH /retro-items/{itemId}` `{ body }` | `200` the card |
| Delete a card (`deleteRetroItem`) | `DELETE /retro-items/{itemId}` | `204` |
| Vote / take it back (`voteRetroItem`, `unvoteRetroItem`) | `POST` / `DELETE /retro-items/{itemId}/votes` | `200 { itemId, voteCount, votedByMe, votesLeft }` |
| Make an action (`createRetroAction`) | `POST /retros/{retroId}/actions` `{ title, ownerId, itemId?, sprintId? }` | `201` the action |
| Close (`closeRetro`) | `POST /retros/{retroId}/close` | `200` the closed retro |

- There is no list of retros: every sprint response has `hasRetro` and `retroId` (`null` without one).
- `body` is a TipTap document as a JSON string, like a comment's.
- `sprintId` must be a `PLANNED` sprint (`400 BAD_REQUEST` otherwise); left out = the end of the backlog. `ownerId` must be a project member (`400 BAD_REQUEST`).

Errors by code: `RETRO_SPRINT_NOT_ENDED`, `RETRO_CLOSED`, `ALREADY_VOTED`, `NO_VOTES_LEFT` (all `409`), `INVALID_RICH_TEXT` / `INVALID_MENTION` (`400`), `RESOURCE_NOT_FOUND` ("Sprint / Retrospective / Card not found."). Texts in `RETRO_ERROR_MESSAGES` ([constants/retro.js](../src/constants/retro.js)).

## Frontend

- **Getting there.** `retroEntry` ([utils/retro.js](../src/utils/retro.js)) decides Create, Open or nothing for an ended sprint. [RetroButton](../src/components/retro/RetroButton.jsx) shows it on the sprint's page and on each row of Previous sprints. After ending a sprint on the Board, a manager is asked once ([RetroPromptDialog](../src/components/retro/RetroPromptDialog.jsx), router state `askRetro`). Both create through `useOpenRetro`.
- **Page** `…/sprints/retros/:retroId` (`retroPath`; the Sprints tab stays selected): [RetroPage](../src/components/retro/RetroPage.jsx) loads, [RetroBoard](../src/components/retro/RetroBoard.jsx) keeps the retro from then on: header, unfinished actions, the three columns ("Sort by votes", "Votes left"), actions.
- **State:** [useRetroBoard](../src/components/retro/useRetroBoard.js). A change goes to the backend first and its answer is put into the retro; nothing is counted here. Votes go one at a time, because every answer has `votesLeft` and a late one would show an old number. It loads the retro again every `RETRO_POLL_MS` (20 s) while it's open and the tab is visible, on Refresh, and after a refusal that means the page is out of date (`RETRO_REFRESH_CODES`); a load that overlaps a change is repeated.
- **Cards:** [RetroCardForm](../src/components/retro/RetroCardForm.jsx) keeps a refused text, also when the retro was closed meanwhile. Known gap: a card that someone deletes while its author is editing it disappears with the next load, and the edit with it.
- **Votes:** [RetroVoteButton](../src/components/retro/RetroVoteButton.jsx); a vote can always be taken back, a new one needs one left (`canToggleVote`).
- **Actions:** [RetroActionDialog](../src/components/retro/RetroActionDialog.jsx) from a card ("Make action", title from its text) or the list ("Create action"). A card deleted meanwhile only loses its link; a sprint that started meanwhile can't be chosen again. The list is [RetroActions](../src/components/retro/RetroActions.jsx), also used for the earlier retro's.
- Tests: [tests/retro.test.js](../tests/retro.test.js).

## Notifications and audit log

- `RETRO_REMINDER` (a sprint ended, to the other managers), `RETRO_OPENED`, `RETRO_CLOSED` and a card's `MENTIONED` all open with `kind: "SPRINT"`: the sprint's page, which has "Open retro". See [notifications.md](notifications.md).
- Closing writes `RETRO_CLOSED` to the audit log, with the sprint as its target.

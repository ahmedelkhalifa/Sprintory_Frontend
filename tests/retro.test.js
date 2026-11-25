import test from "node:test";
import assert from "node:assert/strict";
import {
  actionTitle,
  applyVote,
  columnItems,
  EMPTY_RETRO_ACTION,
  removeItem,
  replaceItem,
  retroActionRequest,
  retroEntry,
  retroPath,
  validateRetroAction,
} from "../src/utils/retro.js";

const doc = (...paragraphs) =>
  JSON.stringify({ type: "doc", content: paragraphs.map((text) => ({ type: "paragraph", content: [{ type: "text", text }] })) });

const card = (id, extra = {}) => ({
  id,
  column: "TO_IMPROVE",
  createdAt: `2026-11-26T10:0${id}:00Z`,
  voteCount: 0,
  votedByMe: false,
  ...extra,
});

const retro = (extra = {}) => ({ id: 7, votesPerMember: 3, votesLeft: 2, items: [card(1), card(2)], actions: [], ...extra });

const scrum = (...permissions) => ({ id: 15, template: "SCRUM", permissions });

test("retroPath is under the Sprints tab", () => {
  assert.equal(retroPath({ slug: "acme" }, { id: 15 }, 7), "/workspaces/acme/projects/15/sprints/retros/7");
});

test("retroEntry offers Create to a manager of an ended sprint without a retro", () => {
  const manager = scrum("VIEW_WORK", "RETRO_MANAGE");
  assert.equal(retroEntry({ status: "COMPLETED", retroId: null }, manager), "create");
  assert.equal(retroEntry({ status: "CANCELLED", retroId: null }, manager), "create");
  // a backend without retros yet sends no retroId
  assert.equal(retroEntry({ status: "COMPLETED" }, manager), "create");
  assert.equal(retroEntry({ status: "COMPLETED", retroId: null }, manager, { writable: false }), null);
  assert.equal(retroEntry({ status: "COMPLETED", retroId: null }, scrum("VIEW_WORK", "RETRO_CONTRIBUTE")), null);
});

test("retroEntry offers Open to everyone who can see the work, also when the project is read-only", () => {
  const sprint = { status: "COMPLETED", retroId: 7 };
  assert.equal(retroEntry(sprint, scrum("VIEW_WORK")), "open");
  assert.equal(retroEntry(sprint, scrum("VIEW_WORK", "RETRO_MANAGE"), { writable: false }), "open");
  assert.equal(retroEntry(sprint, scrum()), null);
});

test("retroEntry offers nothing before the sprint ends or outside Scrum", () => {
  const manager = scrum("VIEW_WORK", "RETRO_MANAGE");
  assert.equal(retroEntry({ status: "ACTIVE" }, manager), null);
  assert.equal(retroEntry({ status: "PLANNED" }, manager), null);
  assert.equal(retroEntry({ status: "COMPLETED", retroId: 7 }, { ...manager, template: "KANBAN" }), null);
  assert.equal(retroEntry(null, manager), null);
  assert.equal(retroEntry({ status: "COMPLETED" }, null), null);
});

test("columnItems keeps one column, oldest first, without changing the list", () => {
  const items = [card(3), card(1), card(2, { column: "IDEAS" })];
  assert.deepEqual(columnItems(items, "TO_IMPROVE").map((i) => i.id), [1, 3]);
  assert.deepEqual(columnItems(items, "WENT_WELL"), []);
  assert.deepEqual(columnItems(undefined, "IDEAS"), []);
  assert.deepEqual(items.map((i) => i.id), [3, 1, 2]);
});

test("columnItems by votes puts the most votes first, ties oldest first", () => {
  const items = [card(1, { voteCount: 1 }), card(3, { voteCount: 4 }), card(2, { voteCount: 4 })];
  assert.deepEqual(columnItems(items, "TO_IMPROVE", { byVotes: true }).map((i) => i.id), [2, 3, 1]);
});

test("columnItems orders cards made at the same moment by id", () => {
  const createdAt = "2026-11-26T10:00:00Z";
  assert.deepEqual(columnItems([card(2, { createdAt }), card(1, { createdAt })], "TO_IMPROVE").map((i) => i.id), [1, 2]);
});

test("replaceItem adds a new card at the end and an edited one in its place", () => {
  assert.deepEqual(replaceItem(retro(), card(3)).items.map((i) => i.id), [1, 2, 3]);
  const edited = replaceItem(retro(), card(1, { editedAt: "2026-11-26T11:00:00Z" }));
  assert.deepEqual(edited.items.map((i) => i.id), [1, 2]);
  assert.equal(edited.items[0].editedAt, "2026-11-26T11:00:00Z");
});

test("removeItem gives the caller's vote back and keeps the action without its card", () => {
  const before = retro({
    votesLeft: 1,
    items: [card(1, { votedByMe: true, voteCount: 2 }), card(2)],
    actions: [{ id: 3, itemId: 1 }, { id: 4, itemId: 2 }],
  });
  const after = removeItem(before, 1);
  assert.deepEqual(after.items.map((i) => i.id), [2]);
  assert.equal(after.votesLeft, 2);
  assert.deepEqual(after.actions, [{ id: 3, itemId: null }, { id: 4, itemId: 2 }]);
});

test("removeItem gives nothing back for a card the caller didn't vote on, and never more than the limit", () => {
  assert.equal(removeItem(retro(), 1).votesLeft, 2);
  assert.equal(removeItem(retro({ votesLeft: 3, items: [card(1, { votedByMe: true })] }), 1).votesLeft, 3);
  const same = retro();
  assert.equal(removeItem(same, 99), same);
});

test("applyVote takes the card's votes and the remaining votes from the answer", () => {
  const after = applyVote(retro(), { itemId: 2, voteCount: 5, votedByMe: true, votesLeft: 1 });
  assert.equal(after.votesLeft, 1);
  assert.equal(after.items[1].voteCount, 5);
  assert.equal(after.items[1].votedByMe, true);
  assert.equal(after.items[0].voteCount, 0);
});

test("actionTitle is the card's text on one line", () => {
  assert.equal(actionTitle(doc("Time-box  stand-ups", "to 15 minutes")), "Time-box stand-ups to 15 minutes");
  assert.equal(actionTitle(null), "");
});

test("actionTitle is at most 255 characters and never ends in half an emoji", () => {
  assert.equal(actionTitle(doc("a".repeat(300))).length, 255);
  assert.equal(actionTitle(doc(`${"a".repeat(254)}😀`)), "a".repeat(254));
});

test("validateRetroAction requires a title, an owner and a chosen sprint", () => {
  assert.deepEqual(validateRetroAction(EMPTY_RETRO_ACTION), { title: "Title is required", ownerId: "Choose an owner" });
  const valid = { title: "Shorter stand-ups", owner: { userId: 31 }, destination: "backlog", sprintId: "" };
  assert.deepEqual(validateRetroAction(valid), {});
  assert.deepEqual(validateRetroAction({ ...valid, destination: "sprint" }), { sprintId: "Choose a sprint" });
  assert.deepEqual(validateRetroAction({ ...valid, destination: "sprint", sprintId: 44 }), {});
  assert.deepEqual(validateRetroAction({ ...valid, title: "a".repeat(256) }), { title: "Use at most 255 characters" });
});

test("retroActionRequest sends the card and the sprint only when there is one", () => {
  const values = { title: " Shorter stand-ups ", owner: { userId: 31 }, destination: "backlog", sprintId: 44 };
  assert.deepEqual(retroActionRequest(values), { title: "Shorter stand-ups", ownerId: 31 });
  assert.deepEqual(retroActionRequest({ ...values, destination: "sprint", sprintId: "44" }, 512), {
    title: "Shorter stand-ups",
    ownerId: 31,
    itemId: 512,
    sprintId: 44,
  });
});

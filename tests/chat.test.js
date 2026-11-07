import test from "node:test";
import assert from "node:assert/strict";
import {
  applyChatEvent,
  canDeleteChatMessage,
  canEditChatMessage,
  canOpenProjectChat,
  canWriteChat,
  chatConversationPath,
  chatErrorAction,
  chatProjectsFromPages,
  chatsPath,
  chatSocketUrl,
  mergeChatMessages,
} from "../src/utils/chat.js";

const message = (id, details = {}) => ({ id, content: { type: "doc" }, deleted: false, authorId: 2, ...details });
const active = { archivedAt: null };

test("REST pages and live events are deduplicated and ordered by id", () => {
  assert.deepEqual(
    mergeChatMessages([message(5), message(7)], [message(3), message(5, { deleted: true })]).map((m) => [m.id, m.deleted]),
    [
      [3, false],
      [5, true],
      [7, false],
    ],
  );
});

test("edit and delete events replace the message instead of adding one", () => {
  const edited = applyChatEvent([message(1)], { type: "EDITED", message: message(1, { editedAt: "2026-01-01T00:00:00Z" }) });
  assert.equal(edited.length, 1);
  assert.equal(edited[0].editedAt, "2026-01-01T00:00:00Z");
  assert.equal(applyChatEvent(edited, { type: "DELETED", message: message(1, { deleted: true }) })[0].deleted, true);
  assert.equal(applyChatEvent(edited, { type: "UNKNOWN", message: message(2) }), edited);
});

test("Viewers can't write; a moderator deletes others' messages but edits only their own", () => {
  const viewer = { permissions: ["VIEW_PROJECT", "VIEW_WORK"] };
  const pm = { permissions: ["COMMENT", "MODERATE_COMMENTS"] };
  const dev = { permissions: ["COMMENT"] };
  assert.equal(canWriteChat(viewer, active), false);
  assert.equal(canWriteChat(pm, active), true);
  assert.equal(canEditChatMessage(message(1), pm, active, 1), false);
  assert.equal(canDeleteChatMessage(message(1), pm, active, 1), true);
  assert.equal(canDeleteChatMessage(message(1), dev, active, 1), false);
  assert.equal(canEditChatMessage(message(1), dev, active, 2), true);
  assert.equal(canDeleteChatMessage(message(1, { deleted: true }), pm, active, 2), false);
});

test("nothing can be written in an archived workspace or project", () => {
  const pm = { permissions: ["COMMENT", "MODERATE_COMMENTS"] };
  assert.equal(canWriteChat(pm, { archivedAt: "2026-11-01T00:00:00Z" }), false);
  assert.equal(canWriteChat({ ...pm, status: "ARCHIVED" }, active), false);
});

test("the socket uses the backend's host, /ws/chat and wss under https", () => {
  assert.equal(chatSocketUrl("https://example.test/api/v1"), "wss://example.test/ws/chat");
  assert.equal(chatSocketUrl("http://localhost:8080/api/v1"), "ws://localhost:8080/ws/chat");
});

test("a refused frame's action comes from its destination", () => {
  assert.equal(chatErrorAction("/app/projects/42/chat.send"), "send");
  assert.equal(chatErrorAction("/app/projects/42/chat.edit"), "edit");
  assert.equal(chatErrorAction("/app/projects/42/chat.delete"), "delete");
  assert.equal(chatErrorAction(undefined), null);
});

test("only members open a project's chat; the Chats list is deduplicated and sorted", () => {
  assert.equal(canOpenProjectChat({ id: 1, roles: [], permissions: ["MANAGE_MEMBERS"] }), false);
  assert.equal(canOpenProjectChat({ id: 2, roles: ["VIEWER"] }), true);
  const result = chatProjectsFromPages([
    { content: [{ id: 3, name: "Zulu", roles: ["MEMBER"] }, { id: 2, name: "Hidden", roles: [] }] },
    { content: [{ id: 1, name: "alpha", roles: ["VIEWER"] }, { id: 3, name: "Zulu", roles: ["MEMBER"] }] },
  ]);
  assert.deepEqual(result.map((p) => p.id), [1, 3]);
});

test("the Chats page and a conversation have their own urls", () => {
  const workspace = { slug: "engineering" };
  assert.equal(chatsPath(workspace), "/workspaces/engineering/chats");
  assert.equal(chatConversationPath(workspace, { id: 42 }), "/workspaces/engineering/chats/42");
});

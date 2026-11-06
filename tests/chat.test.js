import test from "node:test";
import assert from "node:assert/strict";
import {
  mergeChatMessages, applyChatEvent, canWriteChat, canDeleteChatMessage,
  canEditChatMessage, isEmptyChatDoc, safeChatHref, chatSocketUrl,
} from "../src/utils/chat.js";

const message = (id, details = {}) => ({ id, content: { type: "doc" }, deleted: false, authorId: 2, ...details });

test("REST pages and socket events are deduplicated and ordered by persisted ID", () => {
  assert.deepEqual(mergeChatMessages([message(5), message(7)], [message(3), message(5, { deleted: true })]).map((m) => [m.id, m.deleted]),
    [[3, false], [5, true], [7, false]]);
});

test("edit and delete events update existing messages, not create duplicates", () => {
  const edited = applyChatEvent([message(1)], { type: "EDITED", message: message(1, { editedAt: "2026-01-01T00:00:00Z" }) });
  assert.equal(edited.length, 1);
  assert.equal(edited[0].editedAt, "2026-01-01T00:00:00Z");
  assert.equal(applyChatEvent(edited, { type: "DELETED", message: message(1, { deleted: true }) })[0].deleted, true);
  assert.equal(applyChatEvent(edited, { type: "UNKNOWN", message: message(2) }), edited);
});

test("Viewer cannot write; moderator deletes but cannot edit other author's messages", () => {
  const workspace = { status: "ACTIVE" };
  const viewer = { permissions: ["VIEW_PROJECT"] };
  const pm = { permissions: ["COMMENT", "MODERATE_COMMENTS"] };
  assert.equal(canWriteChat(viewer, workspace), false);
  assert.equal(canWriteChat(pm, workspace), true);
  assert.equal(canEditChatMessage(message(1), pm, workspace, 1), false);
  assert.equal(canDeleteChatMessage(message(1), pm, workspace, 1), true);
  assert.equal(canEditChatMessage(message(1), pm, workspace, 2), true);
  assert.equal(canWriteChat({ ...pm, status: "ARCHIVED" }, workspace), false);
  assert.equal(canWriteChat(pm, { status: "ARCHIVED" }), false);
});

test("blank documents are rejected but @mentions count as text", () => {
  assert.equal(isEmptyChatDoc({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "  " }] }] }), true);
  assert.equal(isEmptyChatDoc({ type: "doc", content: [{ type: "paragraph", content: [{ type: "mention", attrs: { kind: "user", id: "4", label: "Jane" } }] }] }), false);
});

test("rendering only permits safe external links, never script schemes", () => {
  assert.equal(safeChatHref("javascript:alert(1)"), null);
  assert.equal(safeChatHref("data:text/html,hi"), null);
  assert.equal(safeChatHref("https://example.com/a"), "https://example.com/a");
});

test("socket URL uses backend host, native websocket path and secure scheme", () => {
  assert.equal(chatSocketUrl("https://example.test/api/v1"), "wss://example.test/ws/chat");
  assert.equal(chatSocketUrl("http://localhost:8080/api/v1"), "ws://localhost:8080/ws/chat");
});

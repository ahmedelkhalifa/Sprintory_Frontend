import test from "node:test";
import assert from "node:assert/strict";
import { canOpenProjectChat, chatProjectsFromPages, isProjectChatRoute, sidebarChatPath, chatsPath, chatConversationPath } from "../src/utils/chatSidebar.js";

test("workspace admins cannot open chats for projects they haven't joined", () => {
  assert.equal(canOpenProjectChat({ id: 1, roles: [], permissions: ["MANAGE_MEMBERS"] }), false);
  assert.equal(canOpenProjectChat({ id: 2, roles: ["VIEWER"] }), true);
  assert.equal(canOpenProjectChat({ id: 3, roles: ["PROJECT_MANAGER"] }), true);
});

test("projects from all pages are deduplicated, filtered by membership and sorted", () => {
  const result = chatProjectsFromPages([
    { content: [{ id: 3, name: "Zulu", roles: ["MEMBER"] }, { id: 2, name: "Hidden", roles: [] }] },
    { content: [{ id: 1, name: "Alpha", roles: ["VIEWER"] }, { id: 3, name: "Zulu", roles: ["MEMBER"] }] },
  ]);
  assert.deepEqual(result.map((p) => p.id), [1, 3]);
});

test("sidebar chat routes use existing project tabs and exclude non-chat pages", () => {
  const workspace = { slug: "demo" };
  assert.equal(sidebarChatPath(workspace, { id: 7 }), "/workspaces/demo/projects/7/chat");
  assert.equal(isProjectChatRoute("/workspaces/demo/projects/7/chat"), true);
  assert.equal(isProjectChatRoute("/workspaces/demo/projects/7/board"), false);
  assert.equal(isProjectChatRoute("/workspaces/demo/projects/7/chat/extras"), false);
});

test("Chats hub has a workspace-scoped list and deep links to conversations", () => {
  const workspace = { slug: "engineering" };
  assert.equal(chatsPath(workspace), "/workspaces/engineering/chats");
  assert.equal(chatConversationPath(workspace, { id: 42 }), "/workspaces/engineering/chats/42");
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  blockedTooltip,
  confirmedMove,
  cycleMessage,
  cyclePathOf,
  DEPENDENCY_DIRECTIONS,
  dependencyCandidates,
  dependencyHistoryLine,
  dependencyRequest,
  dependencyTaskLabel,
  isOpenDependency,
  moveConfirmation,
  openBlockersOf,
} from "../src/utils/dependency.js";

const { BLOCKED_BY, BLOCKS } = DEPENDENCY_DIRECTIONS;
const summary = (id, key, statusCategory = "TODO") => ({ id, key, title: `Task ${key}`, statusName: "To Do", statusCategory });
const conflict = (data) => ({ response: { status: 409, data } });

test("dependencyRequest makes the same link from either task", () => {
  // "Add blocker" PMP-10 on PMP-11 and "Add blocked task" PMP-11 on PMP-10
  assert.deepEqual(dependencyRequest(BLOCKED_BY.value, 11, 10), { blockerId: 10, blockedId: 11 });
  assert.deepEqual(dependencyRequest(BLOCKS.value, 10, 11), { blockerId: 10, blockedId: 11 });
});

test("dependencyCandidates leaves out the task itself, subtasks and links in the same direction", () => {
  const tasks = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4, parentTaskId: 2 }];
  const dependencies = { blockedBy: [{ id: 90, task: summary(2, "PMP-2") }], blocks: [{ id: 91, task: summary(3, "PMP-3") }] };
  assert.deepEqual(dependencyCandidates(tasks, 1, dependencies, BLOCKED_BY.value).map((t) => t.id), [3]);
  // the reverse link stays offered: the backend refuses it as a cycle and says why
  assert.deepEqual(dependencyCandidates(tasks, 1, dependencies, BLOCKS.value).map((t) => t.id), [2]);
  assert.deepEqual(dependencyCandidates(tasks, 1, null, BLOCKS.value).map((t) => t.id), [2, 3]);
});

test("open means a category other than DONE, whatever the column is called", () => {
  assert.equal(isOpenDependency(summary(1, "PMP-1", "IN_PROGRESS")), true);
  assert.equal(isOpenDependency({ ...summary(1, "PMP-1", "DONE"), statusName: "Shipped" }), false);
});

test("openBlockersOf reads the task response's derived fields", () => {
  assert.deepEqual(openBlockersOf({ blocked: true, openBlockers: [summary(1, "PMP-1")] }).map((t) => t.key), ["PMP-1"]);
  assert.deepEqual(openBlockersOf({ blocked: false, openBlockers: [] }), []);
  assert.deepEqual(openBlockersOf({}), []); // a response from before dependencies existed
});

test("blockedTooltip lists every open blocker", () => {
  assert.equal(blockedTooltip([]), "");
  assert.equal(blockedTooltip([summary(10, "PMP-10")]), "Blocked by PMP-10 Task PMP-10");
  assert.equal(
    blockedTooltip([summary(10, "PMP-10"), summary(12, "PMP-12")]),
    "Blocked by 2 tasks: PMP-10 Task PMP-10, PMP-12 Task PMP-12",
  );
  assert.equal(dependencyTaskLabel({ key: "PMP-3" }), "PMP-3");
});

test("cyclePathOf takes the response's path, or reads it from the message", () => {
  const path = ["PMP-12", "PMP-10", "PMP-11", "PMP-12"];
  assert.deepEqual(cyclePathOf(conflict({ code: "DEPENDENCY_CYCLE", cyclePath: path })), path);
  assert.deepEqual(
    cyclePathOf(conflict({ code: "DEPENDENCY_CYCLE", message: "This would create a cycle: PMP-12 -> PMP-10 -> PMP-11 -> PMP-12." })),
    path,
  );
  assert.deepEqual(cyclePathOf(conflict({ code: "DEPENDENCY_ALREADY_EXISTS" })), []);
  assert.equal(cycleMessage(path), "This would create a cycle: PMP-12 -> PMP-10 -> PMP-11 -> PMP-12.");
  assert.equal(cycleMessage([]), "This would create a cycle.");
});

test("moveConfirmation recognizes both warnings and keeps earlier flags on the retry", () => {
  const blockers = [summary(10, "PMP-10", "IN_PROGRESS")];
  const blocked = moveConfirmation(conflict({ code: "BLOCKED_TASK_CONFIRMATION_REQUIRED", openBlockers: blockers }));
  assert.deepEqual(blocked, { kind: "blocked", flag: "confirmBlocked", openBlockers: blockers });
  const subtasks = moveConfirmation(conflict({ code: "OPEN_SUBTASKS_CONFIRMATION_REQUIRED" }));
  assert.equal(subtasks.flag, "confirmOpenSubtasks");
  assert.equal(moveConfirmation(conflict({ code: "CONFLICT" })), null);
  assert.equal(moveConfirmation(new Error("network")), null);

  const first = confirmedMove({ statusId: 14, afterTaskId: null }, blocked);
  assert.deepEqual(confirmedMove(first, subtasks), { statusId: 14, afterTaskId: null, confirmBlocked: true, confirmOpenSubtasks: true });
});

test("dependencyHistoryLine words both sides of a link", () => {
  const entry = (type, value, refId = 10) => ({
    type,
    field: null,
    oldValue: type === "DEPENDENCY_REMOVED" ? value : null,
    newValue: type === "DEPENDENCY_ADDED" ? value : null,
    refId,
  });
  assert.deepEqual(dependencyHistoryLine(entry("DEPENDENCY_ADDED", "Blocked by PMP-10")), {
    text: "added blocker PMP-10",
    taskKey: "PMP-10",
    taskId: 10,
  });
  assert.equal(dependencyHistoryLine(entry("DEPENDENCY_ADDED", "Blocks PMP-11", 11)).text, "added blocked task PMP-11");
  assert.equal(dependencyHistoryLine(entry("DEPENDENCY_REMOVED", "Blocked by PMP-10")).text, "removed blocker PMP-10");
  assert.equal(dependencyHistoryLine(entry("DEPENDENCY_REMOVED", "Blocks PMP-11", null)).taskId, undefined);
  assert.deepEqual(dependencyHistoryLine(entry("DEPENDENCY_ADDED", null)), { text: "added a dependency" });
});

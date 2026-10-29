import test from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_TASK_FILTERS,
  countPickedFilters,
  countTaskFilters,
  hasTaskFilters,
  pickedLabel,
  taskFilterParams,
} from "../src/utils/taskFilters.js";

test("taskFilterParams: nothing set sends no filter", () => {
  assert.deepEqual(taskFilterParams(EMPTY_TASK_FILTERS), {});
  assert.equal(hasTaskFilters(EMPTY_TASK_FILTERS), false);
  assert.equal(countTaskFilters(EMPTY_TASK_FILTERS), 0);
});

test("taskFilterParams: trims the search and drops a blank one", () => {
  assert.deepEqual(taskFilterParams({ ...EMPTY_TASK_FILTERS, q: "  mob-4 " }), { q: "mob-4" });
  assert.deepEqual(taskFilterParams({ ...EMPTY_TASK_FILTERS, q: "   " }), {});
});

test("taskFilterParams: sends only the filters that are set", () => {
  const filters = { ...EMPTY_TASK_FILTERS, type: "BUG", assigneeId: 7, statusId: 12, label: "backend" };
  assert.deepEqual(taskFilterParams(filters), { type: "BUG", assigneeId: 7, statusId: 12, label: "backend" });
  assert.equal(countTaskFilters(filters), 4);
  assert.equal(hasTaskFilters(filters), true);
});

test("countPickedFilters: the Filter button's count leaves the search out", () => {
  assert.equal(countPickedFilters({ ...EMPTY_TASK_FILTERS, q: "login" }), 0);
  assert.equal(countPickedFilters({ ...EMPTY_TASK_FILTERS, q: "login", type: "BUG", assigneeId: 7 }), 2);
});

test("pickedLabel: the picked option's name, or empty", () => {
  const group = { options: [{ value: 7, label: "Alex Morgan" }, { value: 9, label: "Sarah Chen" }] };
  assert.equal(pickedLabel(group, 9), "Sarah Chen");
  assert.equal(pickedLabel(group, null), "");
  assert.equal(pickedLabel(group, 42), ""); // e.g. someone no longer in the project
});

test("taskFilterParams: every filter together", () => {
  const filters = { q: "login", assigneeId: 3, type: "STORY", priority: "HIGH", statusId: 2, label: "R09" };
  assert.deepEqual(taskFilterParams(filters), filters);
  assert.equal(countTaskFilters(filters), 6);
});

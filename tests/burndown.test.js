import test from "node:test";
import assert from "node:assert/strict";
import {
  chartRows,
  dayLabel,
  loadOptions,
  saveOptions,
  scopeChangeText,
  startedSprints,
  todayIndex,
  unestimatedText,
  weekendBands,
} from "../src/utils/burndown.js";

const dates = ["2026-12-04", "2026-12-04", "2026-12-05", "2026-12-06", "2026-12-07"];

test("options default, persist and survive broken storage", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const saved = new Map();
  const use = (value) => Object.defineProperty(globalThis, "localStorage", { value, configurable: true });
  try {
    use({ getItem: (k) => saved.get(k) ?? null, setItem: (k, v) => saved.set(k, v) });
    assert.deepEqual(loadOptions(), { unit: "points", days: "working" });
    saveOptions({ unit: "tasks", days: "calendar" });
    assert.deepEqual(loadOptions(), { unit: "tasks", days: "calendar" });
    use(undefined);
    assert.doesNotThrow(() => saveOptions({ unit: "tasks", days: "calendar" }));
    assert.deepEqual(loadOptions(), { unit: "points", days: "working" });
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete globalThis.localStorage;
  }
});

test("only started sprints: active first, then the latest ended", () => {
  const result = startedSprints(
    [{ id: 1, status: "PLANNED" }, { id: 2, status: "ACTIVE" }],
    [
      { id: 3, status: "COMPLETED", completedAt: "2026-10-01T00:00:00Z" },
      { id: 4, status: "CANCELLED", completedAt: "2026-11-01T00:00:00Z" },
    ],
  );
  assert.deepEqual(result.map((s) => s.id), [2, 4, 3]);
});

test("rows keep zero and null apart", () => {
  const rows = chartRows({ dates: ["a", "b"], ideal: [1, 0], actual: [0, null], scopeChanges: [null, 0] });
  assert.equal(rows[0].actual, 0);
  assert.equal(rows[1].actual, null);
});

test("Start point, today and weekend shading", () => {
  assert.equal(dayLabel(dates, 0), "Start");
  assert.equal(dayLabel(dates, 1), "4 Dec");
  assert.equal(todayIndex(dates, "2026-12-04"), 1);
  assert.equal(todayIndex(dates, "2027-01-01"), null);
  assert.deepEqual(weekendBands(dates), [{ from: 1, to: 2 }, { from: 2, to: 3 }]);
});

test("texts", () => {
  assert.equal(scopeChangeText(3, "POINTS"), "+3 pts");
  assert.equal(scopeChangeText(-2, "POINTS"), "−2 pts");
  assert.equal(scopeChangeText(1, "TASKS"), "+1 task");
  assert.equal(scopeChangeText(0, "TASKS"), null);
  assert.equal(scopeChangeText(null, "TASKS"), null);
  assert.equal(unestimatedText(1), "1 task has no estimate and is not counted");
});

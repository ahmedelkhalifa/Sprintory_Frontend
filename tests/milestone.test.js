import test from "node:test";
import assert from "node:assert/strict";
import {
    MILESTONE_DESCRIPTION_MAX,
    MILESTONE_NAME_MAX,
    deleteMilestoneText,
    milestoneRequest,
    progressLabel,
    validateMilestoneForm,
} from "../src/utils/milestone.js";

test("progressLabel formats task counts and switches to story points when present", () => {
    assert.equal(progressLabel(null), "");
    assert.equal(
        progressLabel({ totalTasks: 5, doneTasks: 2, totalPoints: 0, donePoints: 0, basis: "TASKS" }),
        "2 / 5 tasks",
    );
    assert.equal(
        progressLabel({ totalTasks: 5, doneTasks: 2, totalPoints: 13, donePoints: 8, basis: "POINTS" }),
        "8 / 13 pts (2 / 5 tasks)",
    );
});

test("deleteMilestoneText describes how many tasks will be unlinked", () => {
    assert.equal(deleteMilestoneText({ progress: { totalTasks: 0 } }), "It has no tasks.");
    assert.equal(deleteMilestoneText({}), "It has no tasks.");
    assert.equal(deleteMilestoneText({ progress: { totalTasks: 1 } }), "1 task will be unlinked.");
    assert.equal(deleteMilestoneText({ progress: { totalTasks: 4 } }), "4 tasks will be unlinked.");
});

test("validateMilestoneForm enforces required fields and length limits", () => {
    assert.equal(MILESTONE_DESCRIPTION_MAX, 500);
    assert.deepEqual(validateMilestoneForm({ name: "   ", targetDate: "", description: "" }), {
        name: "Name is required.",
        targetDate: "Target date is required.",
    });

    assert.deepEqual(
        validateMilestoneForm({
            name: "x".repeat(MILESTONE_NAME_MAX + 1),
            targetDate: "not-a-date",
            description: "y".repeat(MILESTONE_DESCRIPTION_MAX + 1),
        }),
        {
            name: `Use at most ${MILESTONE_NAME_MAX} characters.`,
            targetDate: "Enter a valid date.",
            description: `Use at most ${MILESTONE_DESCRIPTION_MAX} characters.`,
        },
    );

    assert.deepEqual(
        validateMilestoneForm({ name: "Beta release", targetDate: "2026-12-01", description: "First public build" }),
        {},
    );
});

test("milestoneRequest trims text fields and turns blank description into null", () => {
    assert.deepEqual(
        milestoneRequest({ name: "  Beta release  ", targetDate: "2026-12-01", description: "   " }),
        { name: "Beta release", targetDate: "2026-12-01", description: null },
    );
    assert.deepEqual(
        milestoneRequest({ name: "v1.0", targetDate: "2026-12-15", description: "  Launch  " }),
        { name: "v1.0", targetDate: "2026-12-15", description: "Launch" },
    );
});
// Milestone helpers and form validation (PMP-150). Pure, so they can be unit tested.

export const MILESTONE_NAME_MAX = 100;
export const MILESTONE_DESCRIPTION_MAX = 1000;
export const MILESTONE_LIMIT = 50;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

// "2 / 5 tasks" or "8 / 13 pts (2 / 5 tasks)" when any linked task has story points
export const progressLabel = (progress) => {
    if (!progress) return "";
    const tasksPart = `${progress.doneTasks} / ${progress.totalTasks} tasks`;
    return progress.basis === "POINTS"
        ? `${progress.donePoints} / ${progress.totalPoints} pts (${tasksPart})`
        : tasksPart;
};

// Returns { name?, targetDate?, description? } keyed by backend field names
export const validateMilestoneForm = ({ name, targetDate, description }) => {
    const errors = {};
    const trimmedName = (name ?? "").trim();
    const trimmedDesc = (description ?? "").trim();

    if (!trimmedName) errors.name = "Name is required.";
    else if (trimmedName.length > MILESTONE_NAME_MAX) {
        errors.name = `Use at most ${MILESTONE_NAME_MAX} characters.`;
    }

    if (!targetDate) errors.targetDate = "Target date is required.";
    else if (!ISO_DAY.test(targetDate)) errors.targetDate = "Enter a valid date.";

    if (trimmedDesc.length > MILESTONE_DESCRIPTION_MAX) {
        errors.description = `Use at most ${MILESTONE_DESCRIPTION_MAX} characters.`;
    }

    return errors;
};

export const milestoneRequest = ({ name, targetDate, description }) => ({
    name: name.trim(),
    targetDate,
    description: (description ?? "").trim() || null,
});
/**
 * Calculates suggested capacity for a sprint based on velocity history and member availability.
 * Formula: avgVelocity (last 3) * (availableDays / totalNormalDays)
 */
export const calculateSuggestedCapacity = ({
                                               velocityHistory = [], // array of numbers, e.g. [28, 30, 32]
                                               membersAvailability = [], // [{ userId, availableDays, normalDays: 10 }]
                                               sprintWorkingDays = 10,
                                           }) => {
    // If no completed sprints in history, return null (manual input required)
    if (!velocityHistory || velocityHistory.length === 0) {
        return null;
    }

    const lastSprints = velocityHistory.slice(-3);
    const avgVelocity = lastSprints.reduce((acc, v) => acc + v, 0) / lastSprints.length;

    if (!membersAvailability || membersAvailability.length === 0) {
        return Math.round(avgVelocity);
    }

    let totalAvailable = 0;
    let totalNormal = 0;

    membersAvailability.forEach((m) => {
        const normal = m.normalDays ?? sprintWorkingDays;
        const available = m.availableDays ?? normal;
        totalAvailable += available;
        totalNormal += normal;
    });

    if (totalNormal === 0) return Math.round(avgVelocity);

    const availabilityRatio = totalAvailable / totalNormal;
    return Math.round(avgVelocity * availabilityRatio);
};

/**
 * Summarizes story points for a list of tasks.
 */
export const calculateSprintPoints = (tasks = []) => {
    let totalPoints = 0;
    let unestimatedCount = 0;

    tasks.forEach((task) => {
        // Top-level items only (Story, Task, Bug) - subtasks follow parent
        const pts = Number(task.estimate);
        if (isNaN(pts) || task.estimate === null || task.estimate === undefined || task.estimate === "") {
            unestimatedCount += 1;
        } else {
            totalPoints += pts;
        }
    });

    return { totalPoints, unestimatedCount };
};
import { useState } from "react";
import { Box, Button, IconButton, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ToneChip from "../general/ToneChip";
import { SPRINT_STATUS } from "../../constants/tasks";
import { formatDate } from "../../utils/format";
import { formatEstimate, sumEstimates } from "../../utils/task";

const plural = (count, noun) => `${count} ${noun}${count === 1 ? "" : "s"}`;

const sprintDates = (sprint) =>
    sprint?.startDate && sprint?.endDate
        ? `${formatDate(sprint.startDate)} – ${formatDate(sprint.endDate)}`
        : "No dates yet";

const countUnestimated = (tasks = []) =>
    tasks.filter((t) => t.estimate === null || t.estimate === undefined || t.estimate === "").length;

export const EstimateSummary = ({ tasks = [], capacity = null }) => {
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const total = sumEstimates(safeTasks);
    const over = capacity !== null && total > capacity;
    const unestimatedCount = countUnestimated(safeTasks);

    const label = capacity === null ? formatEstimate(total) : `${formatEstimate(total)} / ${formatEstimate(capacity)}`;

    let hint = capacity === null ? "Estimate total" : "Estimate total / capacity";
    if (over) {
        hint = `Over capacity by ${formatEstimate(total - capacity)}`;
    }

    return (
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
            <Tooltip title={hint}>
                <Box component="span" sx={{ display: "inline-flex" }}>
                    <ToneChip label={label} tone={over ? "warning.main" : "text.secondary"} />
                </Box>
            </Tooltip>

            {unestimatedCount > 0 && (
                <Tooltip title={`${unestimatedCount} task${unestimatedCount === 1 ? "" : "s"} have no story point estimate.`}>
                    <Box component="span" sx={{ display: "inline-flex" }}>
                        <ToneChip
                            label={`${unestimatedCount} not estimated`}
                            tone="warning.main"
                            icon={<WarningAmberIcon sx={{ fontSize: "14px !important" }} />}
                        />
                    </Box>
                </Tooltip>
            )}
        </Box>
    );
};

const SprintHeader = ({ sprint, canPlan, startBlocked, onStart, onEdit, onDelete }) => {
    const [anchor, setAnchor] = useState(null);
    const status = SPRINT_STATUS[sprint?.status] ?? SPRINT_STATUS.PLANNED;
    const planned = sprint?.status === "PLANNED" || !sprint?.status;
    const safeTasks = Array.isArray(sprint?.tasks) ? sprint.tasks : [];

    const pick = (action) => {
        setAnchor(null);
        action();
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                px: { xs: 2, sm: 2.5 },
                py: 1.75,
            }}
        >
            <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 1.25, rowGap: 0.5 }}>
                    <Typography component="h3" sx={{ fontWeight: 700, fontSize: 16 }}>
                        {sprint?.name || "Sprint"}
                    </Typography>
                    <ToneChip label={status.label} tone={status.tone} dot />
                    <Typography variant="body2" color="text.secondary">
                        {sprintDates(sprint)} · {plural(safeTasks.length, "task")}
                    </Typography>
                </Box>
                {sprint?.goal && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, overflowWrap: "anywhere" }}>
                        <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
                            Goal:
                        </Box>{" "}
                        {sprint.goal}
                    </Typography>
                )}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EstimateSummary tasks={safeTasks} capacity={sprint?.capacity ?? null} />
                {canPlan && planned && (
                    <Tooltip title={startBlocked ? "Another sprint is already active" : ""}>
            <span>
              <Button size="small" variant="contained" disabled={startBlocked} onClick={onStart}>
                Start sprint
              </Button>
            </span>
                    </Tooltip>
                )}
                {canPlan && (
                    <>
                        <IconButton size="small" aria-label={`Actions for ${sprint?.name}`} onClick={(e) => setAnchor(e.currentTarget)}>
                            <MoreVertIcon fontSize="small" />
                        </IconButton>
                        <Menu
                            anchorEl={anchor}
                            open={Boolean(anchor)}
                            onClose={() => setAnchor(null)}
                            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                            transformOrigin={{ vertical: "top", horizontal: "right" }}
                        >
                            <MenuItem onClick={() => pick(onEdit)}>Edit sprint</MenuItem>
                            {planned && (
                                <MenuItem onClick={() => pick(onDelete)} sx={{ color: "error.main" }}>
                                    Delete sprint
                                </MenuItem>
                            )}
                        </Menu>
                    </>
                )}
            </Box>
        </Box>
    );
};

export default SprintHeader;
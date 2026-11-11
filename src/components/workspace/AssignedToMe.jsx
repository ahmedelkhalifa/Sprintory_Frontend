import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Box, Button, Link, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import SectionCard from "../general/SectionCard";
import LoadState from "../general/LoadState";
import ToneChip from "../general/ToneChip";
import { TASK_PRIORITIES, TASK_STAGES, TASK_TYPES } from "../../constants/tasks";
import { taskPath } from "../../utils/task";
import { useWorkspaceAccess } from "../../hooks/useResourceAccess";

// the list starts short; "Show all" opens the rest
const SHOWN_AT_FIRST = 8;

// smaller screens drop the less important columns, so the table never scrolls sideways
const typeCellSx = { width: 44, pr: 0 };
const keyCellSx = { width: 96, whiteSpace: "nowrap" };
const projectCellSx = { display: { xs: "none", md: "table-cell" }, width: 170 };
const statusCellSx = { width: 140 };
const priorityCellSx = { display: { xs: "none", sm: "table-cell" }, width: 110 };

const TypeIcon = ({ type }) => {
  const info = TASK_TYPES[type] ?? TASK_TYPES.TASK;
  const { Icon } = info;
  return <Icon titleAccess={info.label} sx={{ fontSize: 18, color: info.tone, display: "block" }} />;
};

const Priority = ({ priority }) => {
  const info = TASK_PRIORITIES[priority] ?? TASK_PRIORITIES.MEDIUM;
  const { Icon } = info;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
      <Icon sx={{ fontSize: 18, color: info.tone }} aria-hidden="true" />
      <Typography variant="body2" component="span">{info.label}</Typography>
    </Box>
  );
};

// the caller's open tasks across the workspace's projects (from useMyWork), most urgent first
const AssignedToMe = ({ items = [], loading, error, onRetry }) => {
  const navigate = useNavigate();
  const { workspace } = useWorkspaceAccess();
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? items : items.slice(0, SHOWN_AT_FIRST);

  return (
    <SectionCard title="Assigned to me" count={loading ? undefined : items.length}>
      <LoadState
        loading={loading}
        error={error}
        onRetry={onRetry}
        rows={4}
        isEmpty={items.length === 0}
        emptyMessage="Nothing assigned to you right now. Tasks you're assigned in this workspace's projects show up here."
      >
        <Table size="small" sx={{ tableLayout: "fixed" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...typeCellSx, pl: { xs: 2, sm: 2.5 } }}>
                <Box component="span" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                  Type
                </Box>
              </TableCell>
              <TableCell sx={keyCellSx}>Key</TableCell>
              <TableCell>Summary</TableCell>
              <TableCell sx={projectCellSx}>Project</TableCell>
              <TableCell sx={statusCellSx}>Status</TableCell>
              <TableCell sx={{ ...priorityCellSx, pr: { xs: 2, sm: 2.5 } }}>Priority</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.map(({ task, project, stage }) => {
              const to = taskPath(workspace, project, task.id);
              return (
                <TableRow
                  key={task.id}
                  hover
                  onClick={() => navigate(to)}
                  sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}
                >
                  <TableCell sx={{ ...typeCellSx, pl: { xs: 2, sm: 2.5 } }}>
                    <TypeIcon type={task.type} />
                  </TableCell>
                  <TableCell sx={{ ...keyCellSx, color: "text.secondary", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                    {task.key}
                  </TableCell>
                  <TableCell>
                    {/* a real link too, so the row works with the keyboard and "open in new tab" */}
                    <Link
                      component={RouterLink}
                      to={to}
                      color="text.primary"
                      onClick={(e) => e.stopPropagation()}
                      noWrap
                      sx={{ display: "block", fontWeight: 500 }}
                    >
                      {task.title}
                    </Link>
                  </TableCell>
                  <TableCell sx={{ ...projectCellSx, color: "text.secondary" }}>
                    <Typography variant="body2" noWrap>{project.name}</Typography>
                  </TableCell>
                  <TableCell sx={statusCellSx}>
                    <ToneChip label={task.statusName} tone={TASK_STAGES[stage]?.tone} />
                  </TableCell>
                  <TableCell sx={{ ...priorityCellSx, pr: { xs: 2, sm: 2.5 } }}>
                    <Priority priority={task.priority} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {items.length > SHOWN_AT_FIRST && (
          <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 1, borderTop: 1, borderColor: "divider" }}>
            <Button size="small" onClick={() => setShowAll((value) => !value)}>
              {showAll ? "Show fewer" : `Show all ${items.length}`}
            </Button>
          </Box>
        )}
      </LoadState>
    </SectionCard>
  );
};

export default AssignedToMe;

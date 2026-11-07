import { useState } from "react";
import { Alert, Box, Divider, Snackbar, Typography } from "@mui/material";
import SectionCard from "../general/SectionCard";
import LoadState from "../general/LoadState";
import ToneChip from "../general/ToneChip";
import AddColumnButton from "./AddColumnButton";
import { useColumnConfig } from "./useColumnConfig";
import { getBoard } from "../../api/projectsApi";
import { useAsync } from "../../hooks/useAsync";
import { COLUMN_ERROR_MESSAGES, TASK_STAGES } from "../../constants/tasks";
import { columnContentsLabel, overWip } from "../../utils/board";
import { columnCategory } from "../../utils/task";

// The project Settings' "Board columns": the same configuration as the board's column menus (useColumnConfig), but
// reachable without seeing the work. It only needs GET /board, which CONFIGURE_BOARD allows on its own
// (board-docs.md §3.1), so it works in a Scrum project without an active sprint and for a workspace admin who
// isn't in the project. Show it only to people with CONFIGURE_BOARD; `writable` false (archived) makes it read-only.
const BoardColumnsSection = ({ project, writable }) => {
  const state = useAsync((signal) => getBoard(project.id, signal), [project.id], {
    fallback: "Couldn't load the board's columns. Please try again.",
    messages: COLUMN_ERROR_MESSAGES,
  });
  const [notice, setNotice] = useState(null); // { text, severity }
  const board = state.data;
  const columns = board?.columns ?? [];
  const wipEnabled = Boolean(board?.wipLimitsEnabled);
  const config = useColumnConfig({
    projectId: project.id,
    columns,
    kanban: project.template !== "SCRUM",
    wipEnabled,
    contentsOf: (column) => ({ tasks: column.taskCount ?? 0, subtasks: column.subtaskCount ?? 0 }),
    onChanged: state.reload,
    onNotice: setNotice,
  });

  return (
    <SectionCard title="Board columns" count={board ? columns.length : undefined}>
      {!board ? (
        <LoadState loading={!state.error} error={state.error} onRetry={state.reload} rows={4} />
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ px: { xs: 2, sm: 3 }, pt: 2, pb: 1 }}>
            A task's status is its column. Tasks in a Done column count as finished
            {wipEnabled ? "; a WIP limit turns the column red when it holds more tasks than that" : ""}.
          </Typography>
          <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0 }}>
            {columns.map((column, index) => {
              const stage = TASK_STAGES[columnCategory(column, columns)];
              const count = column.taskCount ?? 0;
              const limited = wipEnabled && column.wipLimit != null;
              const contents = columnContentsLabel({ tasks: count, subtasks: column.subtaskCount ?? 0 });
              return (
                <Box component="li" key={column.id}>
                  {index > 0 && <Divider />}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: { xs: 2, sm: 3 }, py: 1.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 20, flexShrink: 0, fontWeight: 600 }}>
                      {index + 1}
                    </Typography>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography noWrap sx={{ fontWeight: 600 }}>
                        {column.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {contents || "Empty"}
                      </Typography>
                    </Box>
                    {limited && (
                      <ToneChip
                        label={`WIP ${count} / ${column.wipLimit}`}
                        tone={overWip(column, count) ? "error.main" : "text.secondary"}
                      />
                    )}
                    {stage && <ToneChip label={stage.label} tone={stage.tone} dot />}
                    {writable && config.menu(column)}
                  </Box>
                </Box>
              );
            })}
          </Box>
          {writable && (
            <Box sx={{ px: { xs: 2, sm: 3 }, pt: 1, pb: 2 }}>
              <AddColumnButton full={config.full} onClick={config.add} />
            </Box>
          )}
        </>
      )}

      {config.dialogs}
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={5000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={notice?.severity ?? "success"} variant="filled" onClose={() => setNotice(null)} sx={{ width: "100%" }}>
          {notice?.text}
        </Alert>
      </Snackbar>
    </SectionCard>
  );
};

export default BoardColumnsSection;

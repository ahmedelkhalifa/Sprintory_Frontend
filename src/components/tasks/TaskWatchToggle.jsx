import { useState } from "react";
import { Button, Tooltip } from "@mui/material";
import { VisibilityOffOutlined, VisibilityOutlined } from "@mui/icons-material";
import { getWatch, unwatchTask, watchTask } from "../../api/notificationsApi";
import { useAsync } from "../../hooks/useAsync";
import { useSubmit } from "../../hooks/useSubmit";

// Watch / Watching on the task page (notifications-docs.md §7): watchers hear about comments and status changes.
// The task response has no flag, so it is loaded on its own. Anyone with VIEW_WORK can watch, also when archived.
const TaskWatchToggle = ({ projectId, taskId }) => {
  const loaded = useAsync((signal) => getWatch(projectId, taskId, signal), [projectId, taskId]);
  const [changed, setChanged] = useState(null); // { taskId, watching } after a click
  const save = useSubmit();

  // not knowing is better shown as nothing than as a "Watch" that may be wrong
  if (loaded.loading || loaded.error) return null;
  const watching = changed?.taskId === taskId ? changed.watching : loaded.data.watching;

  const toggle = async () => {
    const { ok, result } = await save.run(() => (watching ? unwatchTask : watchTask)(projectId, taskId));
    if (ok) setChanged({ taskId, watching: result.watching });
  };

  return (
    <Tooltip
      title={save.error || (watching ? "You get updates about this task. Click to stop." : "Get updates about this task.")}
    >
      {/* the span keeps the tooltip working while the button is disabled */}
      <span>
        <Button
          size="small"
          variant={watching ? "contained" : "outlined"}
          color={save.error ? "error" : "primary"}
          startIcon={watching ? <VisibilityOutlined /> : <VisibilityOffOutlined />}
          onClick={toggle}
          disabled={save.submitting}
          aria-pressed={watching}
        >
          {watching ? "Watching" : "Watch"}
        </Button>
      </span>
    </Tooltip>
  );
};

export default TaskWatchToggle;

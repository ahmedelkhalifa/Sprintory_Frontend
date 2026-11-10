import { useEffect, useRef } from "react";
import { getClosePreview } from "../../api/sprintsApi";
import { useAsync } from "../../hooks/useAsync";
import { TASK_ERROR_MESSAGES } from "../../constants/tasks";

/**
 * The close preview behind the Close and Cancel sprint windows (GET /sprints/{id}/close-preview). Someone else may
 * have ended the sprint meanwhile (409 CONFLICT): then `onGone(text)` is called once, so the window closes, says so
 * and the board reloads.
 */
export const useClosePreview = (sprintId, onGone) => {
  const preview = useAsync((signal) => getClosePreview(sprintId, signal), [sprintId], {
    fallback: "Couldn't load the sprint's numbers. Please try again.",
    messages: TASK_ERROR_MESSAGES,
  });
  const told = useRef(false);
  const { errorCode } = preview;

  useEffect(() => {
    if (errorCode !== "CONFLICT" || told.current) return;
    told.current = true;
    onGone("This sprint is no longer active.");
  }, [errorCode, onGone]);

  return preview;
};

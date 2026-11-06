import { useEffect, useRef } from "react";
import { TASKS_CHANGED } from "../api/tasksApi";

// runs `onChange` when a task of project `projectId` comes back from a delete (TASKS_CHANGED, fired by
// restoreTask), so a list on screen loads again. Always calls the latest `onChange`.
export const useTasksChanged = (projectId, onChange) => {
  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  });

  useEffect(() => {
    const handle = (event) => {
      if (event.detail?.projectId === projectId) latest.current();
    };
    window.addEventListener(TASKS_CHANGED, handle);
    return () => window.removeEventListener(TASKS_CHANGED, handle);
  }, [projectId]);
};

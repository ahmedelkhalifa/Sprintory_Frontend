import { useCallback, useEffect, useState } from "react";
import { getProject, getProjectMembers } from "../api/projectsApi";
import { getErrorMessage } from "../utils/apiErrors";

const ERROR_MESSAGES = {
  404: "Project not found.",
  403: "You don't have access to this project.",
  fallback: "Couldn't load the project. Please try again.",
};

/**
 * Loads a project and its members for the project page.
 * const { project, members, loading, error, reload } = useProjectMembers(projectId);
 */
export function useProjectMembers(projectId) {
  const [reloadCount, setReloadCount] = useState(0);
  // each load has its own key, so we know which load a result belongs to
  const requestKey = `${projectId}:${reloadCount}`;

  const [result, setResult] = useState({ key: null, project: null, members: [], error: "" });

  useEffect(() => {
    // if the user leaves or opens another project before this finishes, drop the late result
    let ignore = false;

    Promise.all([getProject(projectId), getProjectMembers(projectId)])
      .then(([project, members]) => {
        if (!ignore) setResult({ key: requestKey, project, members: members ?? [], error: "" });
      })
      .catch((err) => {
        if (!ignore) setResult({ key: requestKey, project: null, members: [], error: getErrorMessage(err, ERROR_MESSAGES) });
      });

    return () => {
      ignore = true;
    };
  }, [projectId, requestKey]);

  // still loading until the result of the current request arrives
  const loading = result.key !== requestKey;
  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return {
    project: loading ? null : result.project,
    members: loading ? [] : result.members,
    loading,
    error: loading ? "" : result.error,
    reload,
  };
}

import { useCallback, useEffect, useState } from "react";
import { getProjects } from "../api/projectsApi";
import { getErrorMessage } from "../utils/apiErrors";

/**
 * Loads all projects for the projects list page.
 * const { projects, loading, error, reload } = useProjects();
 */
export function useProjects() {
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ key: null, projects: [], error: "" });

  useEffect(() => {
    // drop the result if the page is left before the request finishes
    let ignore = false;

    getProjects()
      .then((projects) => {
        if (!ignore) setResult({ key: reloadCount, projects: projects ?? [], error: "" });
      })
      .catch((err) => {
        if (!ignore) {
          const error = getErrorMessage(err, { fallback: "Couldn't load your projects. Please try again." });
          setResult({ key: reloadCount, projects: [], error });
        }
      });

    return () => {
      ignore = true;
    };
  }, [reloadCount]);

  // still loading until the result of the current request arrives
  const loading = result.key !== reloadCount;
  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return {
    projects: loading ? [] : result.projects,
    loading,
    error: loading ? "" : result.error,
    reload,
  };
}

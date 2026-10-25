import { useEffect, useState } from "react";
import { useMatch } from "react-router-dom";
import { WORKSPACES_CHANGED, listWorkspaces } from "../api/workspacesApi";
import { errorMessage, isAbort } from "../utils/apiError";
import { byName, parseWorkspaceId } from "../utils/workspace";
import { WorkspaceContext } from "./WorkspaceContext";

const STORAGE_KEY = "lastWorkspaceId";

// storage can be unavailable (private window, blocked site data); everything still works without it
const readLast = () => {
  try {
    return parseWorkspaceId(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
};

const saveLast = (id) => {
  try {
    localStorage.setItem(STORAGE_KEY, String(id));
  } catch {
    // see readLast
  }
};

// Knows the user's workspaces and which one they are working in:
// the one in the url (/workspaces/:workspaceId/...), otherwise the last one they opened.
// Exposes { workspaces, loading, error, current, currentId } through useWorkspaces()
const WorkspaceProvider = ({ children }) => {
  const match = useMatch("/workspaces/:workspaceId/*");
  const urlId = parseWorkspaceId(match?.params.workspaceId);
  const [state, setState] = useState({ workspaces: [], loading: true, error: null });
  const { workspaces, loading, error } = state;

  useEffect(() => {
    if (urlId) saveLast(urlId);
  }, [urlId]);

  // reload whenever workspacesApi reports a create/rename/archive/restore/delete;
  // the old list stays on screen until the new one arrives
  useEffect(() => {
    let controller;
    const load = () => {
      controller?.abort();
      controller = new AbortController();
      listWorkspaces(controller.signal)
        .then((list) => setState({ workspaces: [...list].sort(byName), loading: false, error: null }))
        .catch((err) => {
          if (!isAbort(err)) setState({ workspaces: [], loading: false, error: errorMessage(err) });
        });
    };

    load();
    window.addEventListener(WORKSPACES_CHANGED, load);
    return () => {
      window.removeEventListener(WORKSPACES_CHANGED, load);
      controller.abort();
    };
  }, []);

  const wantedId = urlId ?? readLast();
  const current = workspaces.find((w) => w.id === wantedId) ?? null;
  // the url wins even before the list has loaded; a remembered id only counts if it still exists
  const currentId = urlId ?? current?.id ?? null;

  return (
    <WorkspaceContext.Provider value={{ workspaces, loading, error, current, currentId }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export default WorkspaceProvider;

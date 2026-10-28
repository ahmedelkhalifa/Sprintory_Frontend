import { useEffect, useState } from "react";
import { useMatch } from "react-router-dom";
import { WORKSPACES_CHANGED, listWorkspaces } from "../api/workspacesApi";
import { errorMessage, isAbort } from "../utils/apiError";
import { byName, findWorkspace, parseWorkspaceId } from "../utils/workspace";
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

// a retry after a failed load goes through the same listener as a change
const reload = () => window.dispatchEvent(new Event(WORKSPACES_CHANGED));

// Knows the user's workspaces and which one they are working in:
// the one in the url (/workspaces/:workspaceSlug/...), otherwise the last one they opened.
// Exposes { workspaces, loading, refreshing, error, reload, current } through useWorkspaces().
// The url names a workspace by its slug, so this list is also how WorkspaceAccessGuard finds its id.
const WorkspaceProvider = ({ children }) => {
  const match = useMatch("/workspaces/:workspaceSlug/*");
  const segment = match?.params.workspaceSlug;
  const [state, setState] = useState({ workspaces: [], loading: true, refreshing: true, error: null });
  const { workspaces, loading, refreshing, error } = state;

  // a url naming a workspace the user isn't in gives no current one, rather than the last one
  const fromUrl = segment ? findWorkspace(workspaces, segment).workspace : null;
  const current = segment ? fromUrl : (workspaces.find((w) => w.id === readLast()) ?? null);
  const urlId = fromUrl?.id;

  // the id, not the slug: it's what the API takes, and the list is matched against it
  useEffect(() => {
    if (urlId) saveLast(urlId);
  }, [urlId]);

  // reload whenever workspacesApi reports a create/rename/archive/restore/delete;
  // the old list stays on screen until the new one arrives, `refreshing` is true meanwhile
  // (so a just-created workspace's url isn't taken for an unknown one)
  useEffect(() => {
    let controller;
    const load = () => {
      controller?.abort();
      controller = new AbortController();
      setState((prev) => ({ ...prev, refreshing: true }));
      listWorkspaces(controller.signal)
        .then((list) =>
          setState({ workspaces: [...list].sort(byName), loading: false, refreshing: false, error: null }),
        )
        .catch((err) => {
          if (!isAbort(err)) {
            setState({ workspaces: [], loading: false, refreshing: false, error: errorMessage(err) });
          }
        });
    };

    load();
    window.addEventListener(WORKSPACES_CHANGED, load);
    return () => {
      window.removeEventListener(WORKSPACES_CHANGED, load);
      controller.abort();
    };
  }, []);

  return (
    <WorkspaceContext.Provider value={{ workspaces, loading, refreshing, error, reload, current }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export default WorkspaceProvider;

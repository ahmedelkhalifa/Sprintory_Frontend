import { useState } from "react";
import { useMatch } from "react-router-dom";
import { useWorkspaces } from "../context/WorkspaceContext";
import { parseProjectId } from "../utils/project";
import { EVERYWHERE, searchScopes } from "../utils/search";

/**
 * Where the top bar's search looks: the current workspace by default (also on a project page), else everywhere.
 * const { scope, scopes, setScope } = useSearchScope();
 * A pick only holds for the workspace / project it was made on: opening another one goes back to the default.
 */
export const useSearchScope = () => {
  const { current } = useWorkspaces();
  // the search sits above the route guards, so the project id comes from the url itself
  const match = useMatch("/workspaces/:workspaceSlug/projects/:projectId/*");
  const projectId = parseProjectId(match?.params.projectId);
  const scopes = searchScopes({ workspace: current, projectId });
  const where = JSON.stringify([current?.id ?? null, projectId]);
  const [pick, setPick] = useState({ where: null, id: null });

  const fallback = current ? scopes[1] : EVERYWHERE;
  const scope = (pick.where === where && scopes.find((s) => s.id === pick.id)) || fallback;

  return { scope, scopes, setScope: (next) => setPick({ where, id: next.id }) };
};

import { useEffect, useState } from "react";
import { listProjectMembers, listWorkspaceProjects } from "../api/projectsApi";
import { PROJECT_STATUS } from "../constants/projects";
import { useAsync } from "./useAsync";

/**
 * How many projects each tab has: { all, active, archived } (or null while loading).
 * Asks for one item per tab and reads the total; pass `version` to count again after a change.
 */
export function useProjectTabCounts(workspaceId, version) {
  const count = (status) => listWorkspaceProjects(workspaceId, { size: 1, status }).then((page) => page.total);
  const { data } = useAsync(
    async () => {
      const [all, active, archived] = await Promise.all([
        count(undefined),
        count(PROJECT_STATUS.ACTIVE),
        count(PROJECT_STATUS.ARCHIVED),
      ]);
      return { all, active, archived };
    },
    [workspaceId, version],
    { enabled: Boolean(workspaceId) },
  );
  return data;
}

/**
 * A few members of each project in the table, for the avatar stack: { [projectId]: { members, total } }.
 * The projects list doesn't include members, so this asks each project for its first 3 (one request per row).
 * A row whose request fails simply shows no avatars.
 */
export function useMembersPreview(projectIds) {
  const key = projectIds.join(",");
  const [previews, setPreviews] = useState({});

  useEffect(() => {
    let ignore = false;
    key
      .split(",")
      .filter(Boolean)
      .forEach((id) => {
        listProjectMembers(id, { size: 3 })
          .then((page) => {
            if (!ignore) setPreviews((prev) => ({ ...prev, [id]: { members: page.items, total: page.total } }));
          })
          .catch(() => {});
      });
    return () => {
      ignore = true;
    };
  }, [key]);

  return previews;
}

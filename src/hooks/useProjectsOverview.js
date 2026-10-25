import { useEffect, useState } from "react";
import { listProjectMembers, listProjects } from "../api/projectsApi";
import { PROJECT_STATUS } from "../constants/projects";
import { useAsync } from "./useAsync";

/**
 * How many projects each tab has: { all, active, archived } (or null while loading).
 * Asks for one item per tab and reads the total; pass `version` to count again after a change.
 * ASSUMED until R30: the backend ignores `status` today, so all three counts are the same.
 */
export const useProjectTabCounts = (workspaceId, version) => {
  const count = (status, signal) =>
    listProjects(workspaceId, { size: 1, status }, signal).then((page) => page.totalElements);
  const { data } = useAsync(
    async (signal) => {
      const [all, active, archived] = await Promise.all([
        count(undefined, signal),
        count(PROJECT_STATUS.ACTIVE, signal),
        count(PROJECT_STATUS.ARCHIVED, signal),
      ]);
      return { all, active, archived };
    },
    [workspaceId, version],
    { enabled: Boolean(workspaceId) },
  );
  return data;
};

/**
 * A few members of each project in the table, for the avatar stack: { [projectId]: { members, total } }.
 * The projects list doesn't include members, so this asks each project for its first 3 (one request per row).
 * A row whose request fails simply shows no avatars.
 */
export const useMembersPreview = (projectIds) => {
  const key = projectIds.join(",");
  const [previews, setPreviews] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    key
      .split(",")
      .filter(Boolean)
      .forEach((id) => {
        listProjectMembers(id, { size: 3 }, controller.signal)
          .then((page) => {
            if (controller.signal.aborted) return;
            setPreviews((prev) => ({ ...prev, [id]: { members: page.content, total: page.totalElements } }));
          })
          .catch(() => {});
      });
    return () => controller.abort();
  }, [key]);

  return previews;
};

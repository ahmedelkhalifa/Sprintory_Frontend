import api from "./client";
import { pageParams, toPage } from "../utils/paging";

/**
 * Teams API, see teams-docs.md (R02). Only what the projects pages need (the "Add team" picker).
 * TEMP: the teams page (branch pages/teams_page) has its own teamsApi.js;
 * once it is merged into main, keep one file and delete the duplicate.
 * TeamResponse { id, workspaceId, name }   (no member count)
 */

// translator: the only place that knows the backend's field names
const toTeam = (raw) => ({ id: raw.id, workspaceId: raw.workspaceId, name: raw.name });

// one page of the workspace's teams (admins get all, members only their own); q matches the name
export async function listWorkspaceTeams(workspaceId, { q, page, size } = {}) {
  const { data } = await api.get(`/workspaces/${workspaceId}/teams`, { params: pageParams({ q, page, size }) });
  return toPage(data, toTeam);
}

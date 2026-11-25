/** Generate a Jira Cloud sprint export URL without contacting Jira or handling credentials. */
export const jiraSprintExportUrl = (input) => {
  if (typeof input !== "string") return null;
  let url;
  try { url = new URL(input.trim()); }
  catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password || url.port
      || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.atlassian\.net$/i.test(url.hostname)) return null;

  // Jira Cloud company-managed/team-managed board routes and the legacy RapidBoard route.
  const board = url.pathname.match(/^\/jira\/software\/(?:c\/)?projects\/[^/]+\/boards\/([1-9]\d*)(?:\/[^/]*)*\/?$/);
  const legacy = url.pathname === "/secure/RapidBoard.jspa" ? url.searchParams.getAll("rapidView") : [];
  const id = board?.[1] ?? (legacy.length === 1 && /^[1-9]\d*$/.test(legacy[0]) ? legacy[0] : null);
  if (!id) return null;
  return `${url.origin}/rest/agile/1.0/board/${id}/sprint?startAt=0&maxResults=50`;
};

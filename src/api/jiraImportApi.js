import api from "./client";

// A one-time import is opt-in on the backend. No production importer calls without server enablement.
const uploadData = (csv, sprints) => {
  const data = new FormData();
  data.append("csv", csv);
  if (sprints) data.append("sprints", sprints);
  return data;
};

export const previewJiraImport = (projectId, csv, sprints) =>
  api.post(`/projects/${projectId}/jira-import/preview`, uploadData(csv, sprints)).then((r) => r.data);

export const runJiraImport = (projectId, csv, sprints, userMappings) => {
  const data = uploadData(csv, sprints);
  data.append("userMappings", JSON.stringify(userMappings));
  data.append("confirmation", "IMPORT");
  return api.post(`/projects/${projectId}/jira-import`, data).then((r) => r.data);
};

export const listJiraIssueMappings = (projectId) =>
  api.get(`/projects/${projectId}/jira-import/mappings`).then((r) => r.data);

import api from "./client";
import BURNDOWN_SAMPLE from "./burndownSample";

// TEMP: until the backend (PMP-156) is built, VITE_MOCK_BURNDOWN=true shows the contract's example.
// ?. keeps this safe outside Vite
const USE_SAMPLE = import.meta.env?.VITE_MOCK_BURNDOWN === "true";

export const getBurndown = async (sprintId, { unit, days }, signal) => {
  if (USE_SAMPLE) return BURNDOWN_SAMPLE;
  const res = await api.get(`/sprints/${sprintId}/burndown`, { params: { unit, days }, signal });
  return res.data;
};

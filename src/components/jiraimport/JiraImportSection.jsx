import { useEffect, useState } from "react";
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, Divider,
  FormControl, MenuItem, Select, Stack, TextField, Typography,
} from "@mui/material";
import SectionCard from "../general/SectionCard";
import { listProjectMembers } from "../../api/projectsApi";
import { previewJiraImport, runJiraImport, listJiraIssueMappings } from "../../api/jiraImportApi";

const errorMessage = (error) => error?.response?.data?.message || error?.message || "Request failed.";
const fileLabel = (file) => file?.name || "No file selected";
const count = (number, word) => `${number} ${word}${number === 1 ? "" : "s"}`;

const StepHeader = ({ number, title, description }) => (
  <Stack direction="row" spacing={1.5} alignItems="flex-start">
    <Box sx={{ display: "grid", placeItems: "center", bgcolor: "action.hover", width: 30, height: 30,
      borderRadius: "50%", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
      {number}
    </Box>
    <Box>
      <Typography fontWeight={700}>{title}</Typography>
      {description && <Typography variant="body2" color="text.secondary">{description}</Typography>}
    </Box>
  </Stack>
);

const JiraImportSection = ({ project }) => {
  const [csv, setCsv] = useState(null);
  const [sprints, setSprints] = useState(null);
  const [preview, setPreview] = useState(null);
  const [members, setMembers] = useState([]);
  const [mapping, setMapping] = useState({});
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listProjectMembers(project.id, { page: 0, size: 100 })
      .then((result) => { if (!cancelled) setMembers(result.content ?? []); })
      .catch(() => { if (!cancelled) setError("Could not load project members for assignment mapping."); });
    return () => { cancelled = true; };
  }, [project.id]);

  const fileChanged = (file, setter) => {
    setter(file);
    setPreview(null);
    setDone(null);
    setMapping({});
    setConfirmation("");
    setError("");
  };

  const inspect = async () => {
    setBusy(true);
    setError("");
    setDone(null);
    setPreview(null);
    try {
      const result = await previewJiraImport(project.id, csv, sprints);
      setPreview(result);
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  };

  const execute = async () => {
    if (!preview?.ready || confirmation !== "IMPORT") return;
    setBusy(true);
    setError("");
    try {
      const selected = Object.fromEntries(Object.entries(mapping)
        .filter(([, userId]) => userId !== "" && userId != null));
      const result = await runJiraImport(project.id, csv, sprints, selected);
      setDone(result);
      setPreview(null);
      setConfirmation("");
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  };

  const downloadMappings = async () => {
    setError("");
    try {
      const data = await listJiraIssueMappings(project.id);
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)],
        { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `jira-to-sprintory-${project.key}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError(errorMessage(e)); }
  };

  const noNewWork = preview && !preview.newTopLevelItems && !preview.newSubtasks && !preview.newSprints;

  return (
    <SectionCard title="Import from Jira">
      <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
        <Alert severity="info">
          This is a one-time migration, not a synchronization. Use a new, empty Scrum project.
          Existing Jira issues will not be updated after import.
        </Alert>
        <Box>
          <StepHeader number="1" title="Choose export files"
            description="Upload your latest Jira CSV. Include sprint metadata if the export contains sprint assignments." />
          <Stack spacing={1.5} sx={{ mt: 2, ml: { sm: 5.5 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={1.5}>
              <Button size="small" variant="outlined" component="label" sx={{ alignSelf: "flex-start" }}>
                Choose Jira CSV
                <input hidden type="file" accept=".csv,text/csv"
                  onChange={(event) => fileChanged(event.target.files?.[0] ?? null, setCsv)} />
              </Button>
              <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{fileLabel(csv)}</Typography>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={1.5}>
              <Button size="small" variant="outlined" component="label" sx={{ alignSelf: "flex-start" }}>
                Choose sprint JSON
                <input hidden type="file" accept=".json,application/json"
                  onChange={(event) => fileChanged(event.target.files?.[0] ?? null, setSprints)} />
              </Button>
              <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{fileLabel(sprints)}</Typography>
            </Stack>
            <Box>
              <Button variant="contained" disabled={!csv || busy} onClick={inspect}>
                {busy ? "Processing…" : "Preview import"}
              </Button>
            </Box>
          </Stack>
        </Box>

        {error && <Alert severity="error" role="alert">{error}</Alert>}
        {done && (
          <Alert severity="success">
            Import finished: {count(done.createdTopLevel, "item")}, {count(done.createdSubtasks, "subtask")},
            {count(done.createdSprints, "sprint")} and {count(done.commentsImported, "comment")} created.
            {done.skippedExisting > 0 && ` ${count(done.skippedExisting, "previously imported issue")} unchanged.`}
          </Alert>
        )}
        {done && (
          <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} alignItems={{ sm: "center" }}>
            <Button variant="outlined" onClick={downloadMappings} sx={{ alignSelf: "flex-start" }}>
              Download Jira ↔ Sprintory issue mapping
            </Button>
            <Typography variant="body2" color="text.secondary">
              Check your backlog, board, and sprint history before starting work in Sprintory.
            </Typography>
          </Stack>
        )}

        {preview && (
          <>
            <Divider />
            <Box>
              <StepHeader number="2" title="Review what will be imported"
                description={`Source project ${preview.jiraProjectKey} → Sprintory project ${project.key}`} />
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2, ml: { sm: 5.5 } }}>
                <Chip size="small" label={`${preview.sourceIssues} source issues`} />
                <Chip size="small" color="primary" label={`${preview.newTopLevelItems} new items`} />
                <Chip size="small" label={`${preview.newSubtasks} new subtasks`} />
                <Chip size="small" label={`${preview.newSprints} new sprints`} />
                <Chip size="small" label={`${preview.alreadyImported} previously imported`} />
                <Chip size="small" label={`${preview.epicsSkipped} epics skipped`} />
                <Chip size="small" label={`${preview.orphanSubtasksSkipped} orphan subtasks skipped`} />
              </Box>
            </Box>
            {preview.blockers.map((blocker, index) => (
              <Alert key={`block-${index}`} severity="error">{blocker}</Alert>
            ))}
            {preview.warnings.length > 0 && (
              <Accordion disableGutters variant="outlined" sx={{ borderRadius: "8px !important" }}>
                <AccordionSummary expandIcon={<span aria-hidden="true">▾</span>}>
                  <Typography variant="body2" fontWeight={600}>
                    Import notes and limitations ({preview.warnings.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1}>
                    {preview.warnings.map((warning, index) => (
                      <Typography variant="body2" color="text.secondary" key={`warning-${index}`}>
                        • {warning}
                      </Typography>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            )}
            {preview.assignees.length > 0 && (
              <Accordion variant="outlined" disableGutters sx={{ borderRadius: "8px !important" }}>
                <AccordionSummary expandIcon={<span aria-hidden="true">▾</span>}>
                  <Stack>
                    <Typography fontWeight={600} variant="body2">Match Jira assignees (optional)</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Unmatched issues will be imported without an assignee.
                    </Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1.5}>
                    {preview.assignees.map((person) => (
                      <Stack key={person.jiraAccountId} direction={{ xs: "column", sm: "row" }}
                        alignItems={{ sm: "center" }} gap={1}>
                        <Typography variant="body2" sx={{ flex: "1 1 45%", minWidth: 0 }}>
                          {person.displayName || person.jiraAccountId}
                          <Typography component="span" color="text.secondary" variant="caption">
                            {` · ${count(person.issueCount, "issue")}`}
                          </Typography>
                        </Typography>
                        <FormControl size="small" sx={{ flex: "1 1 55%", minWidth: 0 }}>
                          <Select value={mapping[person.jiraAccountId] ?? ""}
                            inputProps={{ "aria-label": `Sprintory member for ${person.displayName || person.jiraAccountId}` }}
                            onChange={(event) => setMapping((previous) => ({
                              ...previous, [person.jiraAccountId]: event.target.value,
                            }))}>
                            <MenuItem value="">Leave unassigned</MenuItem>
                            {members.map((member) => (
                              <MenuItem key={member.userId} value={member.userId}>
                                {member.firstName} {member.lastName} ({member.email})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Stack>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            )}
            {preview.ready ? (
              <Box>
                <StepHeader number="3" title={noNewWork ? "Verify completed migration" : "Confirm migration"}
                  description={noNewWork
                    ? "No new work was found. A repeat import leaves the existing issues unchanged."
                    : "Importing will add the issues and sprints shown above. Check the files and assignments first."} />
                <Stack direction={{ xs: "column", sm: "row" }} gap={1.5}
                  alignItems={{ sm: "center" }} sx={{ mt: 2, ml: { sm: 5.5 } }}>
                  <TextField label="Type IMPORT to confirm" size="small" autoComplete="off"
                    value={confirmation} onChange={(event) => setConfirmation(event.target.value)}
                    sx={{ width: { sm: 225 } }} />
                  <Button variant="contained" color="warning" disabled={busy || confirmation !== "IMPORT"}
                    onClick={execute} sx={{ alignSelf: "flex-start" }}>
                    {busy ? "Importing…" : noNewWork ? "Verify repeat import" : `Import into ${project.key}`}
                  </Button>
                </Stack>
              </Box>
            ) : <Alert severity="error">Import cannot proceed. Resolve the issues listed above.</Alert>}
          </>
        )}
      </Stack>
    </SectionCard>
  );
};

export default JiraImportSection;

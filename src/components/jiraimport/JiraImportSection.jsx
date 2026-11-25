import { useEffect, useState } from "react";
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, Divider,
  FormControl, MenuItem, Select, Stack, TextField, Typography,
} from "@mui/material";
import SectionCard from "../general/SectionCard";
import JiraExportGuide from "./JiraExportGuide";
import { listProjectMembers } from "../../api/projectsApi";
import { previewJiraImport, runJiraImport, listJiraIssueMappings } from "../../api/jiraImportApi";

const errorMessage = (error) => error?.response?.data?.message || error?.message || "Request failed.";
const fileLabel = (file) => file?.name || "No file selected";
const count = (number, word) => `${number} ${word}${number === 1 ? "" : "s"}`;

const StepHeader = ({ number, title, description }) => (
  <Stack direction="row" spacing={1.5} alignItems="flex-start">
    <Typography component="span" variant="subtitle1" sx={{ display: "grid", placeItems: "center",
      bgcolor: "action.hover", width: 34, height: 34, borderRadius: "50%", flexShrink: 0 }}>
      {number}
    </Typography>
    <Box>
      <Typography component="h3" variant="h6">{title}</Typography>
      {description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{description}</Typography>}
    </Box>
  </Stack>
);

const FileCard = ({ title, description, required = false, file, accept, busy, onChange, onRemove }) => (
  <Stack spacing={1.5} sx={{ flex: "1 1 280px", minWidth: 0, p: 2,
    border: 1, borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}>
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" flexWrap="wrap" gap={0.75} alignItems="center">
        <Typography variant="h6" component="h4">{title}</Typography>
        <Chip size="small" label={required ? "Required" : "Optional"} color="default" variant="outlined" />
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{description}</Typography>
    </Box>
    <Box sx={{ flex: 1 }} />
    <Typography variant={file ? "subtitle1" : "body2"} color={file ? "text.primary" : "text.secondary"}
      sx={{ overflowWrap: "anywhere" }} role="status">{fileLabel(file)}</Typography>
    <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
      <Button variant="outlined" component="label" disabled={busy}>
        {file ? "Replace file" : `Choose ${required ? "CSV" : "JSON"} file`}
        <input hidden type="file" accept={accept} disabled={busy} aria-label={title}
          onChange={(event) => { onChange(event.target.files?.[0] ?? null); event.target.value = ""; }} />
      </Button>
      {file && onRemove && <Button size="small" disabled={busy} onClick={onRemove}>Remove</Button>}
    </Stack>
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
          Use a new, empty Scrum project. This is a one-time migration; existing issues will not be updated by later imports.
        </Alert>
        <JiraExportGuide />
        <Divider />
        <Box>
          <StepHeader number="1" title="Choose export files"
            description="Upload your latest Jira CSV. Add sprint JSON if you want to preserve original sprints." />
          <Stack spacing={2} sx={{ mt: 2, ml: { xs: 0, sm: 6 } }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <FileCard title="Work items (CSV)" description="Your Jira work item export."
                required file={csv} accept=".csv,text/csv" busy={busy}
                onChange={(file) => fileChanged(file, setCsv)} />
              <FileCard title="Sprints (JSON)" description="Include original sprint information."
                file={sprints} accept=".json,application/json" busy={busy}
                onChange={(file) => fileChanged(file, setSprints)}
                onRemove={() => fileChanged(null, setSprints)} />
            </Box>
            {!sprints && <Alert severity={csv ? "warning" : "info"}>
              Without sprint JSON, work items will be imported into the backlog. Original sprints cannot be added later by repeating the import.
            </Alert>}
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
                <Chip size="small" label={`${preview.newTopLevelItems} new items`} />
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
              <Accordion disableGutters variant="outlined">
                <AccordionSummary expandIcon={<span aria-hidden="true">▾</span>}>
                  <Typography variant="subtitle1">
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
              <Accordion variant="outlined" disableGutters>
                <AccordionSummary expandIcon={<span aria-hidden="true">▾</span>}>
                  <Stack>
                    <Typography variant="subtitle1">Match Jira assignees (optional)</Typography>
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

import { useId, useState } from "react";
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip,
  Stack, TextField, Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { jiraSprintExportUrl } from "../../utils/jiraSprintExport";
import summary from "../../assets/jira-import-guide/summary.webp";
import allWork from "../../assets/jira-import-guide/all-work.webp";
import clearFilters from "../../assets/jira-import-guide/clear-filters.webp";
import spaceFilter from "../../assets/jira-import-guide/space-filter.webp";
import exportMenu from "../../assets/jira-import-guide/export-menu.webp";
import boardUrlImage from "../../assets/jira-import-guide/board-url.webp";
import saveJson from "../../assets/jira-import-guide/save-json.webp";

const Screenshot = ({ src, alt }) => (
  <Box component="a" href={src} target="_blank" rel="noopener noreferrer"
    aria-label={`${alt} (open larger image in a new tab)`}
    sx={{ display: "block", width: "fit-content", maxWidth: "100%", mt: 1.5,
      bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 1,
      overflow: "hidden", cursor: "zoom-in", "&:hover": { borderColor: "primary.main" },
      "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 3 } }}>
    <Box component="img" src={src} alt={alt} loading="lazy" decoding="async"
      sx={{ display: "block", maxWidth: "100%", height: "auto" }} />
  </Box>
);

const GuideList = ({ children }) => (
  <Box component="ol" sx={{ m: 0, pl: { xs: 3, sm: 4 },
    "& > li": { pl: 0.75, mb: 2 }, "& > li:last-of-type": { mb: 0 },
    "& > li::marker": { fontWeight: 700, color: "text.secondary" } }}>
    {children}
  </Box>
);

const GuideStep = ({ children }) => (
  <Box component="li" sx={{ fontSize: 16, lineHeight: 1.65, color: "text.primary" }}>
    {children}
  </Box>
);

const GuidePanel = ({ title, description, required = false, expanded, onChange, children }) => {
  const id = useId();
  return (
    <Accordion expanded={expanded} onChange={onChange} disableGutters elevation={0} variant="outlined"
      sx={{ borderRadius: "8px !important", "&::before": { display: "none" } }}>
      <AccordionSummary id={`${id}-header`} aria-controls={`${id}-content`}
        expandIcon={<ExpandMoreIcon />}
        sx={{ px: { xs: 1.5, sm: 2.5 }, py: 0.5, minHeight: 70,
          "& .MuiAccordionSummary-content": { my: 1.25, minWidth: 0 } }}>
        <Box component="span" sx={{ display: "block", flex: 1, minWidth: 0, pr: 1 }}>
          <Box component="span" sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
            <Typography component="span" sx={{ fontSize: 16, fontWeight: 700 }}>{title}</Typography>
            <Chip component="span" size="small" label={required ? "Required" : "Optional"}
              color={required ? "primary" : "default"} variant="outlined" />
          </Box>
          <Typography component="span" color="text.secondary" sx={{ display: "block", mt: 0.5, fontSize: 14 }}>
            {description}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: { xs: 1.5, sm: 2.5 }, py: 2.5, borderTop: 1, borderColor: "divider" }}>
        <Box sx={{ maxWidth: 1100 }}>{children}</Box>
      </AccordionDetails>
    </Accordion>
  );
};

const JiraExportGuide = () => {
  const [openGuide, setOpenGuide] = useState(null);
  const [boardUrl, setBoardUrl] = useState("");
  const exportUrl = jiraSprintExportUrl(boardUrl);
  const invalid = Boolean(boardUrl.trim()) && !exportUrl;
  const toggleGuide = (guide) => (_, expanded) => setOpenGuide(expanded ? guide : null);

  return (
    <Stack spacing={1.5}>
      <Box>
        <Typography component="h3" sx={{ fontSize: 17, fontWeight: 700 }}>How to export files from Jira</Typography>
        <Typography color="text.secondary" sx={{ fontSize: 14, mt: 0.5 }}>
          Open a guide for step-by-step instructions. Click any screenshot to enlarge it.
        </Typography>
      </Box>
      <GuidePanel title="1. Export work items (CSV)" description="Tasks, stories, subtasks and other work item details."
        required expanded={openGuide === "csv"} onChange={toggleGuide("csv")}>
        <GuideList>
          <GuideStep>Open your project in Jira.</GuideStep>
          <GuideStep>Navigate to the <strong>Summary</strong> tab.
            <Screenshot src={summary} alt="Jira project navigation with Summary highlighted" />
          </GuideStep>
          <GuideStep>In the Status overview section, click <strong>View all work items</strong>.
            <Screenshot src={allWork} alt="Status overview with the View all work items link highlighted" />
          </GuideStep>
          <GuideStep>Click <strong>Clear filters</strong> to remove any existing filters.
            <Screenshot src={clearFilters} alt="Clear filters button in the work item search" />
          </GuideStep>
          <GuideStep>Make sure <strong>Basic</strong> search mode is selected.</GuideStep>
          <GuideStep>Open the <strong>Space</strong> dropdown and select your project.
            <Typography color="text.secondary" sx={{ fontSize: 14, mt: 0.5, lineHeight: 1.6 }}>
              Leave all other filters empty to include all work items, including completed ones.
            </Typography>
            <Screenshot src={spaceFilter} alt="Basic search mode and Space project filter highlighted" />
          </GuideStep>
          <GuideStep>Click the <strong>⋯</strong> menu in the upper-right corner.</GuideStep>
          <GuideStep>Select <strong>Export → CSV - all fields</strong>.
            <Screenshot src={exportMenu} alt="Three-dot menu, Export submenu and CSV - all fields highlighted" />
          </GuideStep>
          <GuideStep>Upload the downloaded CSV file to Sprintory.</GuideStep>
        </GuideList>
      </GuidePanel>
      <GuidePanel title="2. Export sprints (JSON)" description="Preserve original sprint names, dates, goals and assignments."
        expanded={openGuide === "sprints"} onChange={toggleGuide("sprints")}>
        <Stack spacing={2.5}>
          <Alert severity="info" sx={{ "& .MuiAlert-message": { fontSize: 14, lineHeight: 1.55 } }}>
            If you skip this file, your work items will be imported into the backlog without their original sprints.
            Original sprints cannot be added later by importing again into this project.
          </Alert>
          <GuideList>
            <GuideStep>Open your project in Jira.</GuideStep>
            <GuideStep>Navigate to the <strong>Board</strong> tab.</GuideStep>
            <GuideStep>Copy the URL from your browser's address bar.
              <Screenshot src={boardUrlImage} alt="Board tab and example Jira board address highlighted" />
            </GuideStep>
            <GuideStep>Paste the URL into the field below.
              <TextField label="Jira board URL" fullWidth autoComplete="off" size="medium"
                value={boardUrl} onChange={(event) => setBoardUrl(event.target.value)}
                placeholder="https://your-company.atlassian.net/.../boards/1"
                error={invalid} helperText={invalid ? "Paste a Jira Cloud board URL from the Board tab." : "Use the address of your Jira board."}
                sx={{ mt: 1.5, maxWidth: 720 }} />
            </GuideStep>
            <GuideStep>Click <strong>Open sprint export</strong>. Your sprint information will open in a new browser tab. Stay logged in to Jira.
              <Box sx={{ mt: 1.5 }}>
                <Button variant="contained" component="a" href={exportUrl ?? undefined}
                  target="_blank" rel="noopener noreferrer" disabled={!exportUrl}
                  endIcon={<OpenInNewIcon fontSize="small" />}>
                  Open sprint export
                </Button>
              </Box>
            </GuideStep>
            <GuideStep>Save the file by pressing <strong>Ctrl + S</strong> (Windows/Linux) or <strong>Cmd + S</strong> (Mac).
              <Typography color="text.secondary" sx={{ fontSize: 14, mt: 0.5, lineHeight: 1.6 }}>
                If your browser shows a Save button, you can use that too. Make sure the file ends in <strong>.json</strong>.
              </Typography>
              <Screenshot src={saveJson} alt="Browser JSON viewer with Save button highlighted" />
            </GuideStep>
            <GuideStep>Upload the downloaded JSON file to Sprintory.</GuideStep>
          </GuideList>
        </Stack>
      </GuidePanel>
    </Stack>
  );
};

export default JiraExportGuide;

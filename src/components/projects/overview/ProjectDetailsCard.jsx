import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Link, Skeleton, Typography } from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import OverviewCard from "./OverviewCard";
import TemplateChip from "../TemplateChip";
import { formatDate } from "../../../utils/format";
import { workspacePath } from "../../../utils/workspace";

// a "label    value" row of the details list
const Row = ({ label, children }) => (
  <Box sx={{ display: "grid", gridTemplateColumns: "110px minmax(0, 1fr)", alignItems: "center", gap: 2, py: 0.75 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Box sx={{ minWidth: 0, fontSize: 14 }}>{children}</Box>
  </Box>
);

// "Project details" card: template, key, created date and workspace. Edit changes the name and description.
const ProjectDetailsCard = ({ project, workspace, canEdit, onEdit }) => (
  <OverviewCard
    Icon={DescriptionOutlinedIcon}
    title="Project details"
    action={
      canEdit && (
        <Button size="small" variant="outlined" color="inherit" onClick={onEdit} sx={{ borderColor: "divider" }}>
          Edit
        </Button>
      )
    }
  >
    <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 1.5 }}>
      <Row label="Template">
        <TemplateChip template={project.template} />
      </Row>
      <Row label="Project key">
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {project.key ?? "—"}
        </Typography>
      </Row>
      <Row label="Created">
        <Typography variant="body2">{project.createdAt ? formatDate(project.createdAt) : "—"}</Typography>
      </Row>
      <Row label="Workspace">
        {workspace ? (
          <Link
            component={RouterLink}
            to={workspacePath(workspace)}
            underline="hover"
            sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontWeight: 600, fontSize: 14, maxWidth: "100%" }}
          >
            <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {workspace.name}
            </Box>
            <OpenInNewIcon sx={{ fontSize: 15, flexShrink: 0 }} />
          </Link>
        ) : (
          <Skeleton width={120} />
        )}
      </Row>
    </Box>
  </OverviewCard>
);

export default ProjectDetailsCard;

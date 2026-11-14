import { Link as RouterLink } from "react-router-dom";
import { AvatarGroup, Box, Divider, Link, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ProjectAvatar from "../ProjectAvatar";
import TemplateChip from "../TemplateChip";
import StatusChip from "../StatusChip";
import UserAvatar from "../../general/UserAvatar";
import { formatDate } from "../../../utils/format";
import { isProjectArchived, projectsPath } from "../../../utils/project";
import { useWorkspaceAccess } from "../../../hooks/useResourceAccess";

// one "label: value" item of the meta row under the project name
const Meta = ({ children }) => (
  <Typography variant="body2" color="text.secondary" component="span" sx={{ whiteSpace: "nowrap" }}>
    {children}
  </Typography>
);

// Top of the project page: back link, project avatar, name, template / key / created, and on the right the
// members' avatars and the action menus. The description is in the Overview tab.
// `actions` are the Quick actions + Project settings buttons; `preview` is a PageResponse of the first members.
const ProjectOverviewHeader = ({ project, preview, actions }) => {
  const { workspace } = useWorkspaceAccess();
  const meta = [
    <TemplateChip key="template" template={project.template} />,
    isProjectArchived(project) && <StatusChip key="status" status={project.status} />,
    project.key && <Meta key="key">Project key: <Box component="strong" sx={{ color: "text.primary", fontWeight: 600 }}>{project.key}</Box></Meta>,
    project.createdAt && <Meta key="created">Created {formatDate(project.createdAt)}</Meta>,
  ].filter(Boolean);

  return (
    <Box sx={{ mb: 2 }}>
      <Link
        component={RouterLink}
        to={projectsPath(workspace)}
        underline="hover"
        color="text.secondary"
        sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, fontSize: 14 }}
      >
        <ArrowBackIcon sx={{ fontSize: 18 }} />
        Back to projects
      </Link>

      <Box
        sx={{
          mt: 1.5,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { md: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
          <ProjectAvatar project={project} size={48} sx={{ borderRadius: 2, fontSize: 18, flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" component="h1" sx={{ overflowWrap: "anywhere" }}>
              {project.name}
            </Typography>
            <Box sx={{ mt: 0.75, display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 1.5, rowGap: 1 }}>
              {meta.flatMap((item, i) =>
                i === 0 ? [item] : [<Divider key={`divider-${i}`} orientation="vertical" flexItem />, item],
              )}
            </Box>
          </Box>
        </Box>

        {/* the members' faces sit on the same row as the menus, so the header stays one line tall */}
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
          {preview && preview.totalElements > 0 && (
            <AvatarGroup
              max={4}
              total={preview.totalElements}
              sx={{ mr: 0.5, "& .MuiAvatar-root": { width: 32, height: 32, fontSize: 12, borderColor: "background.paper" } }}
            >
              {preview.content.slice(0, 3).map((member) => (
                <UserAvatar key={member.userId} user={member} size={32} />
              ))}
            </AvatarGroup>
          )}
          {actions}
        </Box>
      </Box>
    </Box>
  );
};

export default ProjectOverviewHeader;

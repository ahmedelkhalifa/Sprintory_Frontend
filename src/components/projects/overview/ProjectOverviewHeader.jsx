import { Link as RouterLink } from "react-router-dom";
import { AvatarGroup, Box, Divider, Link, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ProjectAvatar from "../ProjectAvatar";
import TemplateChip from "../TemplateChip";
import StatusChip from "../StatusChip";
import UserAvatar from "../../general/UserAvatar";
import { formatDate } from "../../../utils/format";
import { PROJECT_STATUS } from "../../../constants/projects";

// one "label: value" item of the meta row under the project name
const Meta = ({ children }) => (
  <Typography variant="body2" color="text.secondary" component="span" sx={{ whiteSpace: "nowrap" }}>
    {children}
  </Typography>
);

// Top of the project page: back link, project avatar, name, description, template / key / created,
// and on the right the action menus and the members' avatars.
// `actions` are the Quick actions + Project settings buttons; `preview` is { items, total } of the first members.
const ProjectOverviewHeader = ({ project, preview, actions }) => {
  const meta = [
    <TemplateChip key="template" template={project.template} />,
    project.status === PROJECT_STATUS.ARCHIVED && <StatusChip key="status" status={project.status} />,
    project.key && <Meta key="key">Project key: <Box component="strong" sx={{ color: "text.primary", fontWeight: 600 }}>{project.key}</Box></Meta>,
    project.createdAt && <Meta key="created">Created {formatDate(project.createdAt)}</Meta>,
  ].filter(Boolean);

  return (
    <Box sx={{ mb: 3 }}>
      <Link
        component={RouterLink}
        to="/projects"
        underline="hover"
        color="text.secondary"
        sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, fontSize: 14 }}
      >
        <ArrowBackIcon sx={{ fontSize: 18 }} />
        Back to projects
      </Link>

      <Box
        sx={{
          mt: 2,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { md: "flex-start" },
          justifyContent: "space-between",
          gap: 2.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, minWidth: 0 }}>
          <ProjectAvatar project={project} size={72} sx={{ borderRadius: 2.5, fontSize: 24, flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 700, letterSpacing: "-0.02em", fontSize: { xs: 24, sm: 30 }, overflowWrap: "anywhere" }}
            >
              {project.name}
            </Typography>
            {project.description && (
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {project.description}
              </Typography>
            )}
            <Box sx={{ mt: 1.25, display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 1.5, rowGap: 1 }}>
              {meta.flatMap((item, i) =>
                i === 0 ? [item] : [<Divider key={`divider-${i}`} orientation="vertical" flexItem />, item],
              )}
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: { xs: "flex-start", md: "flex-end" },
            gap: 2,
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>{actions}</Box>
          {preview && preview.total > 0 && (
            <AvatarGroup
              max={4}
              total={preview.total}
              sx={{ "& .MuiAvatar-root": { width: 36, height: 36, fontSize: 13, borderColor: "background.default" } }}
            >
              {preview.items.slice(0, 3).map((member) => (
                <UserAvatar key={member.userId} user={member} size={36} />
              ))}
            </AvatarGroup>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ProjectOverviewHeader;

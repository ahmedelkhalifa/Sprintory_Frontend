import { Avatar, Box, Breadcrumbs, Chip, Link, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

/**
 * @param {{ project: { name: string, key: string, description?: string } }} props
 */
const ProjectHeader = ({ project }) => {
  const { name, key, description } = project;

  return (
    <Box sx={{ mb: 4 }}>
      {/* as in Jira: Projects / Project name */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/projects" underline="hover" color="text.secondary">
          Projects
        </Link>
        <Typography color="text.primary">{name}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {/* a square "project icon" featuring the key letters, similar to Jira */}
        <Avatar
          variant="rounded"
          sx={{ width: 56, height: 56, bgcolor: "primary.main", fontWeight: 700, fontSize: 18 }}
        >
          {key?.slice(0, 2)}
        </Avatar>

        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {name}
            </Typography>
            <Chip
              label={key}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600, color: "text.secondary", borderRadius: 1 }}
            />
          </Box>
        </Box>
      </Box>

      {description && (
        <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 720 }}>
          {description}
        </Typography>
      )}
    </Box>
  );
};

export default ProjectHeader;

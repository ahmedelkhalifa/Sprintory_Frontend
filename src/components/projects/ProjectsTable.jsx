import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  AvatarGroup,
  Box,
  Link,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ProjectAvatar from "./ProjectAvatar";
import TemplateChip from "./TemplateChip";
import StatusChip from "./StatusChip";
import UserAvatar from "../general/UserAvatar";
import { projectPath } from "../../utils/project";
import { useWorkspaceAccess } from "../../hooks/useResourceAccess";

const headCellSx = { color: "text.secondary", fontWeight: 500, borderColor: "divider" };
// smaller screens drop the less important columns, so the table never scrolls sideways
const keyCellSx = { display: { xs: "none", lg: "table-cell" }, width: 110 };
const templateCellSx = { display: { xs: "none", sm: "table-cell" }, width: 120 };
const membersCellSx = { display: { xs: "none", md: "table-cell" }, width: 150 };
const statusCellSx = { width: { xs: 120, sm: 130 } };
const actionsCellSx = { width: { xs: 52, sm: 84 }, pr: { xs: 1, sm: 3 }, textAlign: "right" };

// avatars of the first members with "N members" under them; a skeleton until the preview arrives
const MembersPreview = ({ preview }) => {
  if (!preview) return <Skeleton width={100} />;
  if (preview.total === 0) return <Typography variant="body2" color="text.secondary">No members</Typography>;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.5 }}>
      <AvatarGroup
        max={4}
        total={preview.total}
        sx={{ "& .MuiAvatar-root": { width: 26, height: 26, fontSize: 10, borderColor: "background.paper" } }}
      >
        {preview.members.map((member) => (
          <UserAvatar key={member.userId} user={member} size={26} />
        ))}
      </AvatarGroup>
      <Typography variant="caption" color="text.secondary" noWrap>
        {preview.total} {preview.total === 1 ? "member" : "members"}
      </Typography>
    </Box>
  );
};

// Table of projects: name, key, template, members, status and actions. Clicking a row opens the project.
// `previews` is { [projectId]: { members, total } } from useMembersPreview;
// `renderActions(project)` fills the last column (the ⋮ menu), or leave it out for no actions column.
const ProjectsTable = ({ projects, previews = {}, renderActions }) => {
  const navigate = useNavigate();
  const { workspace } = useWorkspaceAccess();

  return (
    <TableContainer>
      {/* fixed layout: column widths come from the header, so content can't stretch the table */}
      <Table sx={{ tableLayout: "fixed" }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...headCellSx, pl: { xs: 2, sm: 3 } }}>Name</TableCell>
            <TableCell sx={{ ...headCellSx, ...keyCellSx }}>Key</TableCell>
            <TableCell sx={{ ...headCellSx, ...templateCellSx }}>Template</TableCell>
            <TableCell sx={{ ...headCellSx, ...membersCellSx }}>Members</TableCell>
            <TableCell sx={{ ...headCellSx, ...statusCellSx, ...(!renderActions && { pr: { xs: 2, sm: 3 } }) }}>
              Status
            </TableCell>
            {renderActions && (
              <TableCell sx={{ ...headCellSx, ...actionsCellSx }}>
                {/* the word only fits from tablet width; phones keep the column narrow */}
                <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                  Actions
                </Box>
              </TableCell>
            )}
          </TableRow>
        </TableHead>

        <TableBody>
          {projects.map((project) => {
            const to = projectPath(workspace, project);
            return (
              <TableRow
                key={project.id}
                hover
                onClick={() => navigate(to)}
                sx={{ cursor: "pointer", "& td": { borderColor: "divider" }, "&:last-child td": { border: 0 } }}
              >
                <TableCell sx={{ pl: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                    <ProjectAvatar project={project} />
                    {/* a real link too, so the row works with the keyboard and "open in new tab" */}
                    <Link
                      component={RouterLink}
                      to={to}
                      underline="hover"
                      color="text.primary"
                      onClick={(e) => e.stopPropagation()}
                      noWrap
                      sx={{ fontWeight: 600, minWidth: 0 }}
                    >
                      {project.name}
                    </Link>
                  </Box>
                </TableCell>

                <TableCell sx={{ ...keyCellSx, color: "text.secondary", fontWeight: 600 }}>{project.key ?? "—"}</TableCell>

                <TableCell sx={templateCellSx}>
                  <TemplateChip template={project.template} />
                </TableCell>

                <TableCell sx={membersCellSx}>
                  <MembersPreview preview={previews[project.id]} />
                </TableCell>

                <TableCell sx={{ ...statusCellSx, ...(!renderActions && { pr: { xs: 2, sm: 3 } }) }}>
                  <StatusChip status={project.status} />
                </TableCell>

                {renderActions && <TableCell sx={actionsCellSx}>{renderActions(project)}</TableCell>}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProjectsTable;

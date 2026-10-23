import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  AvatarGroup,
  Box,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ProjectAvatar from "./ProjectAvatar";
import UserAvatar from "../general/UserAvatar";
import { formatDate } from "../../utils/format";

const headCellSx = { color: "text.secondary", fontWeight: 500, borderColor: "divider" };
// the "Updated" column is hidden on phones to keep the table narrow
const updatedCellSx = { display: { xs: "none", sm: "table-cell" } };

// Table of projects; clicking a row opens that project's page
const ProjectsTable = ({ projects }) => {
  const navigate = useNavigate();

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...headCellSx, pl: { xs: 2, sm: 3 } }}>Project</TableCell>
            <TableCell sx={headCellSx}>Members</TableCell>
            <TableCell sx={{ ...headCellSx, ...updatedCellSx, pr: { xs: 2, sm: 3 } }}>Updated</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {projects.map((project) => {
            const to = `/projects/${project.id}`;
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
                    <Box sx={{ minWidth: 0 }}>
                      {/* a real link too, so the row works with the keyboard and "open in new tab" */}
                      <Link
                        component={RouterLink}
                        to={to}
                        underline="hover"
                        color="text.primary"
                        onClick={(e) => e.stopPropagation()}
                        sx={{ fontWeight: 600 }}
                      >
                        {project.name}
                      </Link>
                      {project.description && (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {project.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <AvatarGroup
                    max={4}
                    total={project.memberCount ?? project.membersPreview?.length ?? 0}
                    sx={{
                      justifyContent: "flex-end",
                      width: "fit-content",
                      "& .MuiAvatar-root": { width: 28, height: 28, fontSize: 11, borderColor: "background.paper" },
                    }}
                  >
                    {(project.membersPreview ?? []).map((member) => (
                      <UserAvatar key={member.id} user={member} size={28} />
                    ))}
                  </AvatarGroup>
                </TableCell>

                <TableCell sx={{ ...updatedCellSx, pr: { xs: 2, sm: 3 }, color: "text.secondary", whiteSpace: "nowrap" }}>
                  {formatDate(project.updatedAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProjectsTable;

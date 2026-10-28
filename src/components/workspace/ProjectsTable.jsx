import { Link as RouterLink } from "react-router-dom";
import {
  Box, Button, Card, InputAdornment, Link, Pagination, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Add, FolderOpenOutlined, SearchOutlined } from "@mui/icons-material";
import { initials } from "../../utils/people";
import { projectPath } from "../../utils/project";
import { useWorkspaceAccess } from "../../hooks/useResourceAccess";
import MemberStack from "./MemberStack";

// one page of the workspace's projects, with search and paging done by the backend
const ProjectsTable = ({ projects, total, totalPages, page, onPageChange, search, onSearch, canCreate, onCreate }) => {
  const { workspace } = useWorkspaceAccess();

  return (
    <Card sx={{ p: 3 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FolderOpenOutlined />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Projects</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            All projects in this workspace. Create, manage and track progress.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
          <TextField
            size="small"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          {canCreate && (
            <Button variant="contained" startIcon={<Add />} onClick={onCreate}>Create project</Button>
          )}
        </Box>
      </Box>

      <Box sx={{ overflowX: "auto", mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              {["Name", "Members"].map((h) => (
                <TableCell key={h} sx={{ color: "text.secondary", fontWeight: 500, borderColor: "divider" }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} sx={{ color: "text.secondary", borderColor: "divider" }}>
                  No projects found.
                </TableCell>
              </TableRow>
            )}
            {projects.map((p) => (
              <TableRow key={p.id} hover sx={{ "& td": { borderColor: "divider" } }}>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={(theme) => ({
                        width: 44,
                        height: 44,
                        borderRadius: 1.5,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 14,
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        color: "primary.main",
                      })}
                    >
                      {initials(p.name)}
                    </Box>
                    <Link
                      component={RouterLink}
                      to={projectPath(workspace, p)}
                      underline="hover"
                      color="text.primary"
                      sx={{ fontWeight: 600 }}
                    >
                      {p.name}
                    </Link>
                  </Box>
                </TableCell>
                <TableCell>
                  <MemberStack members={p.memberPreview} total={p.memberCount} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {projects.length} of {total} projects
        </Typography>
        <Pagination
          count={Math.max(totalPages, 1)}
          page={page + 1}
          onChange={(_, value) => onPageChange(value - 1)}
          shape="rounded"
          color="primary"
        />
      </Box>
    </Card>
  );
};

export default ProjectsTable;

import {
    Box, Button, Card, IconButton, InputAdornment, Pagination, Table, TableBody,
    TableCell, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Add, FilterList, FolderOpenOutlined, MoreHoriz, SearchOutlined } from "@mui/icons-material";
import MemberStack from "./MemberStack";

function ProjectsTable({ projects, total, totalPages, page, onPageChange, search, onSearch, canCreate, onCreate }) {
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
                                    <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment>
                                ),
                            },
                        }}
                    />
                    <Button variant="outlined" color="inherit" startIcon={<FilterList />} sx={{ borderColor: "divider" }}>
                        Filter
                    </Button>
                    {canCreate && (
                        <Button variant="contained" startIcon={<Add />} onClick={onCreate}>Create project</Button>
                    )}
                </Box>
            </Box>

            <Box sx={{ overflowX: "auto", mt: 2 }}>
                <Table size="medium">
                    <TableHead>
                        <TableRow>
                            {["Name", "Members", ""].map((h) => (
                                <TableCell key={h} sx={{ color: "text.secondary", fontWeight: 500, borderColor: "divider" }}>
                                    {h}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {projects.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} sx={{ color: "text.secondary", borderColor: "divider" }}>
                                    No projects found.
                                </TableCell>
                            </TableRow>
                        )}
                        {projects.map((p) => (
                            <TableRow key={p.id} hover sx={{ "& td": { borderColor: "divider" } }}>
                                <TableCell>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                        <Box sx={(t) => ({
                                            width: 44, height: 44, borderRadius: 1.5, flexShrink: 0,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontWeight: 700, fontSize: 14,
                                            bgcolor: alpha(t.palette.primary.main, 0.12),
                                            color: "primary.main",
                                        })}>
                                            {p.name.slice(0, 2).toUpperCase()}
                                        </Box>
                                        <Typography sx={{ fontWeight: 600 }}>{p.name}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <MemberStack members={p.memberPreview} total={p.memberCount} />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" aria-label="More"><MoreHoriz /></IconButton>
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
}

export default ProjectsTable;
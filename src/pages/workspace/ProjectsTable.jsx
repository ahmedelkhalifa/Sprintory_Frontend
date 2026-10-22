import {
    Box, Button, Card, Chip, IconButton, InputAdornment, Pagination, Table, TableBody,
    TableCell, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Add, FilterList, FolderOpenOutlined, MoreHoriz, SearchOutlined } from "@mui/icons-material";
import MemberStack from "./MemberStack";
import { toneColor } from "./mockData";

const STATUS_TONE = {
    "In Progress": "success",
    Planning: "primary",
    "On Hold": "error",
    "Not Started": "neutral",
};

function StatusChip({ status }) {
    const tone = STATUS_TONE[status];
    return (
        <Chip
            size="small"
            sx={(t) => ({
                bgcolor: alpha(toneColor(t, tone), 0.12),
                color: "text.primary",
                fontWeight: 500,
            })}
            label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Box sx={(t) => ({ width: 8, height: 8, borderRadius: "50%", bgcolor: toneColor(t, tone) })} />
                    {status}
                </Box>
            }
        />
    );
}

function ProjectsTable({ projects }) {
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
                    <Button variant="contained" startIcon={<Add />}>Create project</Button>
                </Box>
            </Box>

            <Box sx={{ overflowX: "auto", mt: 2 }}>
                <Table size="medium">
                    <TableHead>
                        <TableRow>
                            {["Name", "Status", "Team", "Members", "Updated", ""].map((h) => (
                                <TableCell key={h} sx={{ color: "text.secondary", fontWeight: 500, borderColor: "divider" }}>
                                    {h}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {projects.map((p) => (
                            <TableRow key={p.code} hover sx={{ "& td": { borderColor: "divider" } }}>
                                <TableCell>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                        <Box sx={(t) => ({
                                            width: 44, height: 44, borderRadius: 1.5, flexShrink: 0,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontWeight: 700, fontSize: 14,
                                            bgcolor: alpha(toneColor(t, p.tone), 0.15),
                                            color: "text.primary",
                                        })}>
                                            {p.code}
                                        </Box>
                                        <Box>
                                            <Typography sx={{ fontWeight: 600 }}>{p.name}</Typography>
                                            <Typography variant="body2" color="text.secondary">{p.desc}</Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell><StatusChip status={p.status} /></TableCell>
                                <TableCell>{p.team}</TableCell>
                                <TableCell><MemberStack count={p.members} /></TableCell>
                                <TableCell>{p.updated}</TableCell>
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
                    Showing {projects.length} of 12 projects
                </Typography>
                <Pagination count={2} shape="rounded" color="primary" />
            </Box>
        </Card>
    );
}

export default ProjectsTable;
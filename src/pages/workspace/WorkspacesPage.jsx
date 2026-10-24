import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Card, CardActionArea, Chip, CircularProgress, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";
import NameDialog from "./NameDialog";
import { createWorkspace, getWorkspaces } from "../../api/workspaces";
import { errorMessage } from "../../utils/apiError";

const ROLE_LABEL = { WORKSPACE_ADMIN: "Admin", WORKSPACE_MEMBER: "Member" };

function WorkspaceCard({ workspace, onOpen }) {
    return (
        <Card variant="outlined">
            <CardActionArea onClick={onOpen} sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{
                        width: 44, height: 44, borderRadius: 2, flexShrink: 0,
                        bgcolor: "navActive.background", color: "navActive.text",
                        display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
                    }}>
                        {workspace.name.slice(0, 2).toUpperCase()}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 600 }} noWrap>{workspace.name}</Typography>
                        <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                            <Chip size="small" label={ROLE_LABEL[workspace.role]} />
                            {workspace.archivedAt && <Chip size="small" color="warning" label="Archived" />}
                        </Box>
                    </Box>
                </Box>
            </CardActionArea>
        </Card>
    );
}

function WorkspacesPage() {
    const navigate = useNavigate();
    const [workspaces, setWorkspaces] = useState(null);
    const [error, setError] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        getWorkspaces()
            .then(setWorkspaces)
            .catch((err) => setError(errorMessage(err)));
    }, []);

    if (error) return <Alert severity="error">Could not load workspaces: {error}</Alert>;
    if (!workspaces) return <CircularProgress />;

    const active = workspaces.filter((w) => !w.archivedAt);
    const archived = workspaces.filter((w) => w.archivedAt);

    const grid = (list) => (
        <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" },
            gap: 2,
        }}>
            {list.map((w) => (
                <WorkspaceCard key={w.id} workspace={w} onOpen={() => navigate(`/workspaces/${w.id}`)} />
            ))}
        </Box>
    );

    return (
        <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: 4 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>Workspaces</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
                    Create workspace
                </Button>
            </Box>

            {workspaces.length === 0 && (
                <Typography color="text.secondary">
                    You are not in any workspace yet. Create one to get started.
                </Typography>
            )}

            {active.length > 0 && grid(active)}

            {archived.length > 0 && (
                <>
                    <Typography variant="h6" sx={{ fontWeight: 600, mt: 4, mb: 2 }}>Archived</Typography>
                    {grid(archived)}
                </>
            )}

            <NameDialog
                open={dialogOpen}
                title="Create workspace"
                label="Workspace name"
                onClose={() => setDialogOpen(false)}
                onSubmit={async (name) => {
                    const created = await createWorkspace(name);
                    navigate(`/workspaces/${created.id}`);
                }}
            />
        </Box>
    );
}

export default WorkspacesPage;
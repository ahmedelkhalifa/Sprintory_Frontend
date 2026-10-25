import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Card, CardActionArea, Chip, CircularProgress, IconButton, Typography } from "@mui/material";
import { Add, SettingsOutlined } from "@mui/icons-material";
import { createWorkspace } from "../../api/workspacesApi";
import { useWorkspaces } from "../../context/WorkspaceContext";
import { initials } from "../../utils/people";
import { ROLE_LABEL, isWorkspaceAdmin, isWorkspaceArchived } from "../../utils/workspace";
import NameDialog from "../../components/workspace/NameDialog";
import WorkspaceSettingsDialog from "../../components/workspace/WorkspaceSettingsDialog";

const WorkspaceCard = ({ workspace, onOpen, onSettings }) => {
  const isAdmin = isWorkspaceAdmin(workspace);

  return (
    <Card variant="outlined" sx={{ position: "relative" }}>
      <CardActionArea onClick={onOpen} sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, pr: isAdmin ? 5 : 0 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              flexShrink: 0,
              bgcolor: "navActive.background",
              color: "navActive.text",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
            }}
          >
            {initials(workspace.name)}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600 }} noWrap>{workspace.name}</Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
              <Chip size="small" label={ROLE_LABEL[workspace.role]} />
              {isWorkspaceArchived(workspace) && <Chip size="small" color="warning" label="Archived" />}
            </Box>
          </Box>
        </Box>
      </CardActionArea>
      {/* outside the action area: a button can't be nested inside another button */}
      {isAdmin && (
        <IconButton aria-label="Workspace settings" onClick={onSettings} sx={{ position: "absolute", top: 8, right: 8 }}>
          <SettingsOutlined />
        </IconButton>
      )}
    </Card>
  );
};

// /workspaces: every workspace the user is in, active first, archived below
const WorkspacesPage = () => {
  const navigate = useNavigate();
  // the list reloads by itself after any create/rename/archive/delete (see WorkspaceProvider)
  const { workspaces, loading, error } = useWorkspaces();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsFor, setSettingsFor] = useState(null);

  if (error) return <Alert severity="error">Could not load workspaces: {error}</Alert>;
  if (loading) return <CircularProgress />;

  const active = workspaces.filter((w) => !isWorkspaceArchived(w));
  const archived = workspaces.filter(isWorkspaceArchived);

  const grid = (list) => (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" }, gap: 2 }}>
      {list.map((w) => (
        <WorkspaceCard
          key={w.id}
          workspace={w}
          onOpen={() => navigate(`/workspaces/${w.id}`)}
          onSettings={() => setSettingsFor(w)}
        />
      ))}
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: 4 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>Workspaces</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
          Create workspace
        </Button>
      </Box>

      {workspaces.length === 0 && (
        <Typography color="text.secondary">You are not in any workspace yet. Create one to get started.</Typography>
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
          await createWorkspace(name);
        }}
      />
      {settingsFor && (
        <WorkspaceSettingsDialog
          workspace={settingsFor}
          onClose={() => setSettingsFor(null)}
          onChanged={setSettingsFor}
          onDeleted={() => setSettingsFor(null)}
        />
      )}
    </Box>
  );
};

export default WorkspacesPage;

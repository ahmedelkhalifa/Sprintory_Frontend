import { useEffect, useMemo, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import {
  Alert, Avatar, Box, Button, CircularProgress, Divider, List, ListItemButton,
  ListItemText, Paper, Stack, TextField, Typography,
} from "@mui/material";
import { ArrowBack, ChatBubbleOutlineOutlined } from "@mui/icons-material";
import { getProject, listProjects } from "../../api/projectsApi.js";
import { useWorkspaceAccess } from "../../hooks/useResourceAccess.js";
import { useAsync } from "../../hooks/useAsync.js";
import { errorMessage, isAbort } from "../../utils/apiError.js";
import { parseProjectId } from "../../utils/project.js";
import { canOpenProjectChat, chatProjectsFromPages, chatsPath, chatConversationPath } from "../../utils/chatSidebar.js";
import { ProjectChatPanel } from "../projects/ProjectChatPage.jsx";

const PAGE_SIZE = 50;

async function loadProjects(workspaceId, signal) {
  const pages = [];
  let page = 0;
  let totalPages;
  do {
    const result = await listProjects(workspaceId, { page, size: PAGE_SIZE }, signal);
    pages.push(result);
    totalPages = Math.max(1, Number(result.totalPages) || 1);
    page++;
  } while (page < totalPages && !signal.aborted);
  return chatProjectsFromPages(pages);
}

// A single Chats entry in the main sidebar opens this workspace-scoped hub.
// Selecting a project changes the URL while keeping the project list visible on desktop.
export default function ChatsPage() {
  const { workspace } = useWorkspaceAccess();
  return <WorkspaceChats key={workspace.id} workspace={workspace} />;
}

function WorkspaceChats({ workspace }) {
  const { projectId } = useParams();
  const selectedId = projectId == null ? null : parseProjectId(projectId);
  const [search, setSearch] = useState("");
  const [reload, setReload] = useState(0);
  const [listing, setListing] = useState({ projects: [], loading: true, error: "" });

  useEffect(() => {
    const controller = new AbortController();
    loadProjects(workspace.id, controller.signal)
      .then((projects) => {
        if (!controller.signal.aborted) setListing({ projects, loading: false, error: "" });
      })
      .catch((err) => {
        if (!controller.signal.aborted && !isAbort(err)) {
          setListing({ projects: [], loading: false, error: errorMessage(err, "Could not load project chats.") });
        }
      });
    return () => controller.abort();
  }, [workspace.id, reload]);

  const { projects, loading, error } = listing;
  const selected = selectedId && !loading ? projects.find((project) => Number(project.id) === selectedId) : null;
  // Verify current project access when opening the conversation. The WebSocket backend
  // separately checks membership on both SUBSCRIBE and SEND.
  const projectState = useAsync((signal) => getProject(selectedId, signal), [selectedId, workspace.id], {
    enabled: Boolean(selected),
    fallback: "Could not open the project chat.",
  });
  const verifiedProject = projectState.data?.workspaceId === workspace.id && canOpenProjectChat(projectState.data)
    ? projectState.data : null;
  const matching = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query ? projects.filter((project) =>
      `${project.name ?? ""} ${project.key ?? ""}`.toLocaleLowerCase().includes(query)) : projects;
  }, [projects, search]);

  const retry = () => {
    setListing({ projects: [], loading: true, error: "" });
    setReload((value) => value + 1);
  };

  return <Box sx={{ maxWidth: 1500, mx: "auto", height: "calc(100dvh - 172px)", minHeight: 440, display: "flex", flexDirection: "column", gap: 2 }}>
    <Typography variant="h5" fontWeight={700}>Chats</Typography>
    <Paper variant="outlined" sx={{ display: "flex", flex: 1, minHeight: 0, borderRadius: 2, overflow: "hidden" }}>
      <Box sx={{
        width: { xs: "100%", md: 300 }, maxWidth: { md: 360 }, flexShrink: 0,
        display: { xs: projectId ? "none" : "flex", md: "flex" }, flexDirection: "column", minHeight: 0,
      }}>
        <Box sx={{ p: 2 }}>
          <TextField size="small" fullWidth value={search} onChange={(event) => setSearch(event.target.value)}
            label="Search project chats" inputProps={{ "aria-label": "Search project chats" }} />
        </Box>
        <Divider />
        <Box sx={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
          {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress size={24} /></Box>}
          {!loading && error && <Box sx={{ p: 2 }}>
            <Alert severity="error" action={<Button onClick={retry} size="small">Retry</Button>}>{error}</Alert>
          </Box>}
          {!loading && !error && matching.length === 0 && <Typography color="text.secondary" variant="body2" sx={{ p: 3, textAlign: "center" }}>
            {search ? "No matching project chats" : "No project chats available"}
          </Typography>}
          {!loading && !error && <List disablePadding aria-label="Project chats">{matching.map((project) => {
            const active = Number(project.id) === selectedId;
            return <ListItemButton key={project.id} component={NavLink} to={chatConversationPath(workspace, project)}
              selected={active} sx={{ py: 1.5, px: 2, gap: 1.5, borderBottom: 1, borderColor: "divider" }}>
              <Avatar variant="rounded" sx={(theme) => ({ width: 38, height: 38, fontSize: 14, fontWeight: 700,
                bgcolor: alpha(theme.palette.primary.main, 0.13), color: "primary.main" })}>
                {(project.key ?? project.name ?? "P").slice(0, 2).toUpperCase()}
              </Avatar>
              <ListItemText primary={project.name} secondary={project.key ?? undefined}
                slotProps={{ primary: { noWrap: true, fontWeight: active ? 700 : 500 }, secondary: { noWrap: true } }} />
            </ListItemButton>;
          })}</List>}
        </Box>
      </Box>
      <Divider orientation="vertical" flexItem sx={{ display: { xs: projectId ? "none" : "block", md: "block" } }} />
      <Box sx={{ display: { xs: projectId ? "flex" : "none", md: "flex" }, flex: 1, minWidth: 0, flexDirection: "column" }}>
        {!projectId ? <Box sx={{ flex: 1, display: "grid", placeItems: "center", color: "text.secondary", p: 3 }}>
          <Stack alignItems="center" spacing={1}><ChatBubbleOutlineOutlined fontSize="large" />
            <Typography variant="body2">Select a project to open its chat</Typography></Stack>
        </Box> : <>
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
            <Button component={NavLink} to={chatsPath(workspace)} size="small" startIcon={<ArrowBack />}
              sx={{ display: { md: "none" } }}>Back</Button>
            <Typography fontWeight={700} noWrap>{selected?.name ?? "Project chat"}</Typography>
          </Box>
          <Box sx={{ p: { xs: 1, md: 2 }, flex: 1, minHeight: 0 }}>
            {loading || (selected && projectState.loading) ? <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}><CircularProgress /></Box>
              : !selected || !selectedId || !verifiedProject ? <Alert severity="error" action={selected && projectState.error && <Button onClick={projectState.reload} color="inherit" size="small">Retry</Button>}>
                {selected && projectState.error && projectState.errorCode !== "RESOURCE_NOT_FOUND" ? projectState.error : "Project chat not found or access removed."}
              </Alert>
                : <ProjectChatPanel project={verifiedProject} workspace={workspace} embedded />}
          </Box>
        </>}
      </Box>
    </Paper>
  </Box>;
}

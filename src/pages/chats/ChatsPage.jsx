import { useEffect, useMemo, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import ProjectChatPanel from "../../components/chat/ProjectChatPanel";
import { getProject, listProjects } from "../../api/projectsApi";
import { useAsync } from "../../hooks/useAsync";
import { useWorkspaceAccess } from "../../hooks/useResourceAccess";
import { errorMessage, isAbort } from "../../utils/apiError";
import { canOpenProjectChat, chatConversationPath, chatProjectsFromPages, chatsPath } from "../../utils/chat";
import { parseProjectId } from "../../utils/project";

const PAGE_SIZE = 100;

// every page of the workspace's projects, then only those whose chat the caller can open
const loadChatProjects = async (workspaceId, signal) => {
  const pages = [];
  let page = 0;
  let totalPages;
  do {
    const result = await listProjects(workspaceId, { page, size: PAGE_SIZE }, signal);
    pages.push(result);
    totalPages = Math.max(1, Number(result.totalPages) || 1);
    page += 1;
  } while (page < totalPages);
  return chatProjectsFromPages(pages);
};

// The workspace's Chats page (`/workspaces/:slug/chats`, the sidebar's Chats): the projects whose chat the caller
// can open on the left, the selected one's chat (`.../chats/:projectId`) on the right. On phones one at a time.
const WorkspaceChats = ({ workspace }) => {
  const { projectId } = useParams();
  const selectedId = projectId == null ? null : parseProjectId(projectId);
  const [search, setSearch] = useState("");
  const [reload, setReload] = useState(0);
  const [listing, setListing] = useState({ projects: [], loading: true, error: "" });

  useEffect(() => {
    const controller = new AbortController();
    loadChatProjects(workspace.id, controller.signal)
      .then((projects) => setListing({ projects, loading: false, error: "" }))
      .catch((err) => {
        if (!isAbort(err)) setListing({ projects: [], loading: false, error: errorMessage(err, "Couldn't load the chats.") });
      });
    return () => controller.abort();
  }, [workspace.id, reload]);

  const { projects, loading, error } = listing;
  const selected = selectedId && !loading ? projects.find((project) => Number(project.id) === selectedId) : null;
  // the list may be old: load the project again (its permissions and archived state) before opening its chat
  const projectState = useAsync((signal) => getProject(selectedId, signal), [selectedId], {
    enabled: Boolean(selected),
    fallback: "Couldn't open this chat.",
  });
  const opened =
    projectState.data && projectState.data.workspaceId === workspace.id && canOpenProjectChat(projectState.data)
      ? projectState.data
      : null;
  const shown = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query ? projects.filter((p) => `${p.name ?? ""} ${p.key ?? ""}`.toLocaleLowerCase().includes(query)) : projects;
  }, [projects, search]);

  const retry = () => {
    setListing({ projects: [], loading: true, error: "" });
    setReload((value) => value + 1);
  };

  const conversation = () => {
    if (loading || (selected && projectState.loading)) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (selected && projectState.error && projectState.errorCode !== "RESOURCE_NOT_FOUND") {
      return (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={projectState.reload}>
              Try again
            </Button>
          }
        >
          {projectState.error}
        </Alert>
      );
    }
    if (!opened) return <Alert severity="info">This chat doesn't exist, or you are no longer in the project.</Alert>;
    return <ProjectChatPanel project={opened} workspace={workspace} embedded />;
  };

  return (
    <Box sx={{ maxWidth: 1500, mx: "auto", height: "calc(100dvh - 172px)", minHeight: 440, display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Chats
      </Typography>
      <Paper variant="outlined" sx={{ display: "flex", flex: 1, minHeight: 0, borderRadius: 2, overflow: "hidden" }}>
        <Box
          sx={{
            width: { xs: "100%", md: 300 },
            flexShrink: 0,
            display: { xs: projectId ? "none" : "flex", md: "flex" },
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <Box sx={{ p: 2 }}>
            <TextField
              size="small"
              fullWidth
              label="Search chats"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Box>
          <Divider />
          <Box sx={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                <CircularProgress size={24} />
              </Box>
            )}
            {!loading && error && (
              <Alert
                severity="error"
                sx={{ m: 2 }}
                action={
                  <Button color="inherit" size="small" onClick={retry}>
                    Try again
                  </Button>
                }
              >
                {error}
              </Alert>
            )}
            {!loading && !error && shown.length === 0 && (
              <Typography color="text.secondary" variant="body2" sx={{ p: 3, textAlign: "center" }}>
                {search ? "No chat matches your search." : "You aren't in any project of this workspace yet."}
              </Typography>
            )}
            {!loading && !error && (
              <List disablePadding aria-label="Project chats">
                {shown.map((project) => {
                  const active = Number(project.id) === selectedId;
                  return (
                    <ListItemButton
                      key={project.id}
                      component={NavLink}
                      to={chatConversationPath(workspace, project)}
                      selected={active}
                      sx={{ py: 1.5, px: 2, gap: 1.5, borderBottom: 1, borderColor: "divider" }}
                    >
                      <Avatar
                        variant="rounded"
                        sx={(theme) => ({
                          width: 38,
                          height: 38,
                          fontSize: 14,
                          fontWeight: 700,
                          bgcolor: alpha(theme.palette.primary.main, 0.13),
                          color: "navActive.text",
                        })}
                      >
                        {(project.key ?? project.name ?? "P").slice(0, 2).toUpperCase()}
                      </Avatar>
                      <ListItemText
                        primary={project.name}
                        secondary={project.key ?? undefined}
                        slotProps={{ primary: { noWrap: true, fontWeight: active ? 700 : 500 }, secondary: { noWrap: true } }}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            )}
          </Box>
        </Box>
        <Divider orientation="vertical" flexItem sx={{ display: { xs: projectId ? "none" : "block", md: "block" } }} />
        <Box sx={{ display: { xs: projectId ? "flex" : "none", md: "flex" }, flex: 1, minWidth: 0, flexDirection: "column" }}>
          {!projectId ? (
            <Box sx={{ flex: 1, display: "grid", placeItems: "center", color: "text.secondary", p: 3, textAlign: "center" }}>
              <Box>
                <ChatBubbleOutlineIcon fontSize="large" />
                <Typography variant="body2">Pick a project to open its chat.</Typography>
              </Box>
            </Box>
          ) : (
            <>
              <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
                <Button component={NavLink} to={chatsPath(workspace)} size="small" startIcon={<ArrowBackIcon />} sx={{ display: { md: "none" } }}>
                  Back
                </Button>
                <Typography sx={{ fontWeight: 700 }} noWrap>
                  {selected?.name ?? "Project chat"}
                </Typography>
              </Box>
              <Box sx={{ p: { xs: 1, md: 2 }, flex: 1, minHeight: 0 }}>{conversation()}</Box>
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

// keyed by workspace, so switching workspaces starts with a fresh list
const ChatsPage = () => {
  const { workspace } = useWorkspaceAccess();
  return <WorkspaceChats key={workspace.id} workspace={workspace} />;
};

export default ChatsPage;

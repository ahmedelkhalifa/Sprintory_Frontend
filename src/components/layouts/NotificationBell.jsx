import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Badge, Box, Button, CircularProgress, Divider, IconButton, List, ListItemButton, Popover, Typography,
} from "@mui/material";
import { NotificationsNoneOutlined } from "@mui/icons-material";
import LoadState from "../general/LoadState";
import { listNotifications, markAllRead, openNotification } from "../../api/notificationsApi";
import { useWorkspaces } from "../../context/WorkspaceContext";
import { useNotificationStream } from "../../hooks/useNotificationStream";
import { useSubmit } from "../../hooks/useSubmit";
import { errorCode, errorMessage, isAbort } from "../../utils/apiError";
import { timeAgo } from "../../utils/format";
import { mergeNotifications, notificationTargetPath, notificationWhere } from "../../utils/notification";

const PAGE_SIZE = 10;
// failedMore: the error is from "Load more" (retry that) rather than from loading page 0
const EMPTY_FEED = { items: [], page: 0, totalPages: 0, loading: false, loadingMore: false, error: "", failedMore: false };

// The top bar's bell (notifications-docs.md §12): the unread count stays live through the stream; the list loads
// when it opens, newest first, with "Load more". One bell for every workspace, so each item says where it's from.
const NotificationBell = () => {
  const { unreadCount, setUnreadCount, latest, connection } = useNotificationStream();
  const { workspaces } = useWorkspaces();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(null);
  const [feed, setFeed] = useState(EMPTY_FEED);
  const [reloadCount, setReloadCount] = useState(0);
  const [opening, setOpening] = useState(null); // the id being opened
  const [itemErrors, setItemErrors] = useState({}); // id -> text, e.g. for a deleted task
  const [seen, setSeen] = useState(latest);
  const markAll = useSubmit();
  const open = Boolean(anchor);

  // a pushed notification goes on top (adjusting state while rendering, so it lands in the same render)
  if (latest !== seen) {
    setSeen(latest);
    if (latest) setFeed((prev) => ({ ...prev, items: mergeNotifications([latest], prev.items) }));
  }

  // page 0 on open, and again after the stream reconnects while open (it doesn't replay what it missed)
  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    listNotifications({ page: 0, size: PAGE_SIZE }, controller.signal)
      .then((data) =>
        setFeed((prev) => ({
          ...prev,
          items: data.content,
          page: data.page,
          totalPages: data.totalPages,
          loading: false,
          error: "",
        })),
      )
      .catch((err) => {
        if (!isAbort(err)) {
          setFeed((prev) => ({ ...prev, loading: false, error: errorMessage(err), failedMore: false }));
        }
      });
    return () => controller.abort();
  }, [open, connection, reloadCount]);

  const handleOpen = (e) => {
    setAnchor(e.currentTarget);
    setItemErrors({});
    markAll.clearError();
    setFeed((prev) => ({ ...prev, loading: true, error: "" }));
  };

  const retry = () => {
    setFeed((prev) => ({ ...prev, loading: true, error: "" }));
    setReloadCount((n) => n + 1);
  };

  const loadMore = async () => {
    setFeed((prev) => ({ ...prev, loadingMore: true, error: "" }));
    try {
      const data = await listNotifications({ page: feed.page + 1, size: PAGE_SIZE });
      // the loaded items first: they carry what was marked read here
      setFeed((prev) => ({
        ...prev,
        items: mergeNotifications(prev.items, data.content),
        page: data.page,
        totalPages: data.totalPages,
        loadingMore: false,
      }));
    } catch (err) {
      setFeed((prev) => ({ ...prev, loadingMore: false, error: errorMessage(err), failedMore: true }));
    }
  };

  const markRead = (id) =>
    setFeed((prev) => ({ ...prev, items: prev.items.map((n) => (n.id === id ? { ...n, read: true } : n)) }));

  // "open" marks it read on the backend and says where to go; the stream then sends the new count
  const handleClick = async (notification) => {
    setOpening(notification.id);
    setItemErrors((prev) => ({ ...prev, [notification.id]: "" }));
    try {
      const target = await openNotification(notification.id);
      markRead(notification.id);
      const path = notificationTargetPath(target, workspaces);
      // NONE (an invitation or a security notice): nothing to open, it just turns read
      if (path) {
        setAnchor(null);
        navigate(path);
      }
    } catch (err) {
      // the task or project is gone or no longer visible; the backend still marked it read
      const gone = errorCode(err) === "RESOURCE_NOT_FOUND";
      if (gone) markRead(notification.id);
      const text = gone ? "This item is no longer available." : errorMessage(err);
      setItemErrors((prev) => ({ ...prev, [notification.id]: text }));
    } finally {
      setOpening(null);
    }
  };

  const handleMarkAll = async () => {
    const { ok, result } = await markAll.run(() => markAllRead());
    if (!ok) return;
    setUnreadCount(result.count);
    setFeed((prev) => ({ ...prev, items: prev.items.map((n) => ({ ...n, read: true })) }));
  };

  const hasMore = feed.page < feed.totalPages - 1;

  return (
    <>
      <IconButton
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        color="inherit"
        onClick={handleOpen}
      >
        <Badge badgeContent={unreadCount} max={99} color="error">
          <NotificationsNoneOutlined />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: { xs: "calc(100vw - 32px)", sm: 380 },
              maxHeight: 480,
              display: "flex",
              flexDirection: "column",
            },
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5 }}>
          <Typography component="h2" sx={{ fontWeight: 700 }}>
            Notifications
          </Typography>
          <Button size="small" onClick={handleMarkAll} disabled={!unreadCount || markAll.submitting}>
            Mark all as read
          </Button>
        </Box>
        <Divider />

        {markAll.error && (
          <Alert severity="error" onClose={markAll.clearError} sx={{ m: 1.5 }}>
            {markAll.error}
          </Alert>
        )}

        <Box sx={{ overflowY: "auto" }}>
          <LoadState
            loading={feed.loading && feed.items.length === 0}
            error={feed.items.length === 0 ? feed.error : ""}
            onRetry={retry}
            isEmpty={feed.items.length === 0}
            emptyMessage="You're all caught up."
            rows={3}
          >
            <List disablePadding>
              {feed.items.map((n) => {
                const where = notificationWhere(n);
                return (
                  <ListItemButton
                    key={n.id}
                    onClick={() => handleClick(n)}
                    disabled={opening === n.id}
                    divider
                    sx={{
                      display: "block",
                      py: 1.25,
                      bgcolor: n.read ? "transparent" : "navActive.background",
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: n.read ? 400 : 600 }}>
                      {n.message}
                    </Typography>
                    {n.excerpt && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: "italic" }}>
                        “{n.excerpt}”
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                      {[where, timeAgo(n.createdAt)].filter(Boolean).join(" · ")}
                    </Typography>
                    {itemErrors[n.id] && (
                      <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
                        {itemErrors[n.id]}
                      </Typography>
                    )}
                  </ListItemButton>
                );
              })}
            </List>

            {/* a failed "Load more" or reload, with the list still showing */}
            {feed.error && (
              <Alert
                severity="error"
                sx={{ m: 1.5 }}
                action={
                  <Button color="inherit" size="small" onClick={feed.failedMore ? loadMore : retry}>
                    Try again
                  </Button>
                }
              >
                {feed.error}
              </Alert>
            )}

            {hasMore && !feed.error && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                <Button
                  size="small"
                  onClick={loadMore}
                  disabled={feed.loadingMore}
                  startIcon={feed.loadingMore ? <CircularProgress size={14} color="inherit" /> : null}
                >
                  Load more
                </Button>
              </Box>
            )}
          </LoadState>
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell;

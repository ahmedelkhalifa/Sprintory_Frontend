import { useState } from "react";
import { Avatar, Box, List, ListItemButton, Typography } from "@mui/material";
import { NotificationsNoneOutlined } from "@mui/icons-material";
import SectionCard from "../general/SectionCard";
import LoadState from "../general/LoadState";
import UserAvatar from "../general/UserAvatar";
import { listNotifications } from "../../api/notificationsApi";
import { useAsync } from "../../hooks/useAsync";
import { useOpenNotification } from "../../hooks/useOpenNotification";
import { timeAgo } from "../../utils/format";

const SHOWN = 8;

// who did it: the actor's initials, or a bell for notices without one
const ActorAvatar = ({ actor }) =>
  actor ? (
    <UserAvatar user={{ userId: actor.id, firstName: actor.name }} size={28} />
  ) : (
    <Avatar sx={{ width: 28, height: 28, bgcolor: "action.selected", color: "text.secondary" }}>
      <NotificationsNoneOutlined sx={{ fontSize: 16 }} />
    </Avatar>
  );

// the caller's latest notifications in this workspace (the bell has all of them); a click opens it like the bell does
const RecentUpdates = ({ workspaceId }) => {
  const feed = useAsync((signal) => listNotifications({ workspaceId, size: SHOWN }, signal), [workspaceId], {
    fallback: "Couldn't load the updates. Please try again.",
  });
  const { opening, itemErrors, open } = useOpenNotification();
  // ids opened from here, read since the list loaded
  const [readHere, setReadHere] = useState(() => new Set());
  const items = feed.data?.content ?? [];

  const markRead = (id) => setReadHere((prev) => new Set(prev).add(id));

  return (
    <SectionCard title="Recent updates">
      <LoadState
        loading={feed.loading && !feed.data}
        error={feed.error}
        onRetry={feed.reload}
        rows={3}
        isEmpty={items.length === 0}
        emptyMessage="No updates yet. Mentions, assignments and sprint changes in this workspace show up here."
      >
        <List disablePadding>
          {items.map((n) => {
            const unread = !n.read && !readHere.has(n.id);
            return (
              <ListItemButton
                key={n.id}
                onClick={() => open(n, { onRead: markRead })}
                disabled={opening === n.id}
                sx={{
                  alignItems: "flex-start",
                  gap: 1.5,
                  px: { xs: 2, sm: 2.5 },
                  py: 1.25,
                  borderBottom: 1,
                  borderColor: "divider",
                  "&:last-of-type": { borderBottom: 0 },
                  transition: "background-color 120ms ease",
                }}
              >
                <ActorAvatar actor={n.actor} />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: unread ? 600 : 400, overflowWrap: "anywhere" }}>
                    {n.message}
                  </Typography>
                  {n.excerpt && (
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.25, fontStyle: "italic" }}>
                      “{n.excerpt}”
                    </Typography>
                  )}
                  {/* every item here is this workspace's, so only the project is named */}
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                    {[n.project?.name, timeAgo(n.createdAt)].filter(Boolean).join(" · ")}
                  </Typography>
                  {itemErrors[n.id] && (
                    <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
                      {itemErrors[n.id]}
                    </Typography>
                  )}
                </Box>
                {unread && (
                  <Box
                    role="img"
                    aria-label="Unread"
                    sx={{ width: 8, height: 8, mt: 0.75, flexShrink: 0, borderRadius: "50%", bgcolor: "primary.main" }}
                  />
                )}
              </ListItemButton>
            );
          })}
        </List>
      </LoadState>
    </SectionCard>
  );
};

export default RecentUpdates;

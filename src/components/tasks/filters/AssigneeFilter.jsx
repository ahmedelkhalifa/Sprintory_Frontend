import { useState } from "react";
import { Avatar, Box, ButtonBase, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import UserAvatar from "../../general/UserAvatar";
import { memberLabel } from "../../../utils/people";

// how many avatars show in the row; the rest are in the "+N" menu
const SHOWN = 5;
const SIZE = 34;

// one round, clickable avatar; the picked one gets a ring and sits on top of its neighbours
const AvatarToggle = ({ member, picked, first, onClick }) => (
  <Tooltip title={memberLabel(member)}>
    <ButtonBase
      onClick={onClick}
      aria-pressed={picked}
      aria-label={`Only tasks assigned to ${memberLabel(member)}`}
      sx={{
        ml: first ? 0 : -0.75,
        borderRadius: "50%",
        position: "relative",
        zIndex: picked ? 2 : 1,
        border: "2px solid",
        borderColor: "background.paper",
        boxShadow: (theme) => (picked ? `0 0 0 2px ${theme.palette.primary.main}` : "none"),
        transition: "transform 0.15s",
        "&:hover": { transform: "translateY(-2px)", zIndex: 3 },
      }}
    >
      <UserAvatar user={member} size={SIZE} />
    </ButtonBase>
  </Tooltip>
);

// Jira-style assignee filter: a row of avatars, click one to see only their tasks, click it again to clear.
// More than SHOWN members: the rest are in a "+N" menu. The picked member always shows in the row.
const AssigneeFilter = ({ members, value, onChange }) => {
  const [anchor, setAnchor] = useState(null);
  if (members.length === 0) return null;

  // the picked member moves to the front, so it's visible even when it was in the menu
  const ordered = [...members].sort((a, b) => (b.userId === value) - (a.userId === value));
  const row = ordered.slice(0, SHOWN);
  const rest = ordered.slice(SHOWN);
  const toggle = (userId) => onChange(userId === value ? null : userId);

  return (
    <Box sx={{ display: "flex", alignItems: "center" }} role="group" aria-label="Filter by assignee">
      {row.map((member, i) => (
        <AvatarToggle
          key={member.userId}
          member={member}
          picked={member.userId === value}
          first={i === 0}
          onClick={() => toggle(member.userId)}
        />
      ))}
      {rest.length > 0 && (
        <>
          <Tooltip title="More people">
            <ButtonBase
              onClick={(e) => setAnchor(e.currentTarget)}
              aria-haspopup="menu"
              aria-label={`${rest.length} more people`}
              sx={{ ml: -0.75, borderRadius: "50%", border: "2px solid", borderColor: "background.paper", zIndex: 0 }}
            >
              <Avatar sx={{ width: SIZE, height: SIZE, fontSize: 13, fontWeight: 600, bgcolor: "divider", color: "text.primary" }}>
                +{rest.length}
              </Avatar>
            </ButtonBase>
          </Tooltip>
          <Menu
            anchorEl={anchor}
            open={Boolean(anchor)}
            onClose={() => setAnchor(null)}
            slotProps={{ paper: { sx: { mt: 0.5, minWidth: 220, maxHeight: 360 } } }}
          >
            {rest.map((member) => (
              <MenuItem
                key={member.userId}
                onClick={() => {
                  setAnchor(null);
                  toggle(member.userId);
                }}
              >
                <ListItemIcon>
                  <UserAvatar user={member} size={26} />
                </ListItemIcon>
                <ListItemText>{memberLabel(member)}</ListItemText>
                {member.userId === value && <CheckIcon fontSize="small" sx={{ ml: 1.5, color: "primary.main" }} />}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </Box>
  );
};

export default AssigneeFilter;

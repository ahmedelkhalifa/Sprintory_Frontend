import { Avatar, Box, Typography } from "@mui/material";
import RoleBadge from "./RoleBadge.jsx";

// Dark shades in the palette, so that the white initials remain legible
const AVATAR_COLORS = ["#315A85", "#203B5B", "#4A6F94", "#5E6B85"];

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};

// The same person always gets the same avatar color.
const getAvatarColor = (seed = "") => {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

/**
 * @param {{ member: { id: string|number, name: string, email: string, role: string } }} props
 */
const MemberItem = ({ member }) => {
  const { name, email, role } = member;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 3,
        py: 1.5,
        transition: "background-color 0.15s",
        "&:hover": { bgcolor: "#F7F9FC" },
      }}
    >
      <Avatar
        sx={{
          width: 40,
          height: 40,
          fontSize: 15,
          fontWeight: 600,
          bgcolor: getAvatarColor(email || name),
        }}
      >
        {getInitials(name)}
      </Avatar>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography noWrap sx={{ fontWeight: 600 }}>
          {name}
        </Typography>
        <Typography noWrap variant="body2" color="text.secondary">
          {email}
        </Typography>
      </Box>

      <RoleBadge role={role} />
    </Box>
  );
};

export default MemberItem;

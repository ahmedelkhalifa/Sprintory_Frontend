import { Avatar } from "@mui/material";
import { alpha } from "@mui/material/styles";

const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

export function TeamIcon({ name, size = 52 }) {
  return (
    <Avatar
      variant="rounded"
      aria-hidden="true"
      sx={(theme) => ({
        bgcolor: alpha(theme.palette.primary.main, 0.12),
        color: "primary.dark",
        fontWeight: 800,
        borderRadius: 2,
        width: size,
        height: size,
        fontSize: size > 50 ? "1rem" : "0.82rem",
        flexShrink: 0,
      })}
    >
      {initials(name)}
    </Avatar>
  );
}

export function PersonAvatar({ member, size = 34 }) {
  return (
    <Avatar
      alt={member.name}
      sx={(theme) => ({
        width: size,
        height: size,
        fontSize: size < 34 ? "0.7rem" : "0.78rem",
        fontWeight: 700,
        color: "primary.dark",
        bgcolor: alpha(theme.palette.primary.main, 0.13),
        border: `2px solid ${theme.palette.background.paper}`,
      })}
    >
      {initials(member.name)}
    </Avatar>
  );
}


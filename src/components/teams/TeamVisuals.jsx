import { Avatar } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { initials } from "../../utils/people";

// rounded square with the team's initials
export const TeamIcon = ({ name, size = 52 }) => {
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
};

// round avatar with a person's initials
export const PersonAvatar = ({ name, size = 34 }) => {
  return (
    <Avatar
      alt={name}
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
      {initials(name)}
    </Avatar>
  );
};

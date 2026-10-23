import { Chip } from "@mui/material";
import { alpha } from "@mui/material/styles";

// label and theme color for each project role
const ROLES = {
  OWNER: { label: "Owner", color: (theme) => theme.palette.primary.dark },
  ADMIN: { label: "Admin", color: (theme) => theme.palette.primary.main },
  MEMBER: { label: "Member", color: (theme) => theme.palette.text.secondary },
};

// Small colored label for a member's role in a project
// Unknown roles fall back to the "Member" look with their own text
const RoleChip = ({ role }) => {
  const key = String(role ?? "").toUpperCase();
  const { label, color } = ROLES[key] ?? { ...ROLES.MEMBER, label: role || "Member" };

  return (
    <Chip
      label={label}
      size="small"
      sx={(theme) => ({
        height: 24,
        borderRadius: 1,
        fontWeight: 600,
        color: color(theme),
        bgcolor: alpha(color(theme), 0.12),
      })}
    />
  );
};

export default RoleChip;

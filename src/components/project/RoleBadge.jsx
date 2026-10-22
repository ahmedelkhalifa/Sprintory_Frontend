import { Chip } from "@mui/material";


const ROLE_STYLES = {
  ADMIN: { label: "Admin", bgcolor: "#203B5B", color: "#FFFFFF" }, // Deep Navy
  MEMBER: { label: "Member", bgcolor: "#E6EEF6", color: "#203B5B" }, // pale blue
  VIEWER: { label: "Viewer", bgcolor: "#EEECE6", color: "#667085" }, // warm gray
};

/**
 * @param {{ role: "ADMIN" | "MEMBER" | "VIEWER" | string }} props
 * Регистр не важен ("admin" == "ADMIN"). Неизвестная роль показывается как Viewer-стиль.
 */
const RoleBadge = ({ role }) => {
  const key = String(role ?? "").toUpperCase();
  const style = ROLE_STYLES[key] ?? { ...ROLE_STYLES.VIEWER, label: role || "Unknown" };

  return (
    <Chip
      label={style.label}
      size="small"
      sx={{
        bgcolor: style.bgcolor,
        color: style.color,
        fontWeight: 600,
        borderRadius: 1,
        height: 24,
      }}
    />
  );
};

export default RoleBadge;

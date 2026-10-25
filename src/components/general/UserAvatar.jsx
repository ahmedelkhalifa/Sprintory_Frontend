import { Avatar } from "@mui/material";
import { getInitials } from "../../utils/format";

// theme colors dark enough for white initials to stay readable
const TONES = ["primary.main", "primary.dark", "success.main", "text.secondary"];

// pick a color from the user's id or name, so the same person always gets the same color
const colorFor = (seed = "") => {
  let hash = 0;
  for (const ch of String(seed)) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return TONES[Math.abs(hash) % TONES.length];
};

// Round avatar: the user's photo, or their initials on a theme color
const UserAvatar = ({ user, size = 36, sx }) => {
  // the backend sends people as { userId, ... }; `id` is kept for any older data
  const { firstName, lastName, avatarUrl } = user;
  const color = colorFor(user.userId ?? user.id ?? `${firstName}${lastName}`);

  return (
    <Avatar
      src={avatarUrl || undefined}
      alt={`${firstName} ${lastName}`}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        fontWeight: 600,
        bgcolor: color,
        color: "common.white",
        ...sx,
      }}
    >
      {getInitials(firstName, lastName)}
    </Avatar>
  );
};

export default UserAvatar;

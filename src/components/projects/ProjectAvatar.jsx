import { Avatar } from "@mui/material";
import { alpha } from "@mui/material/styles";

// theme colors the avatars rotate through
const TONES = ["primary", "success", "secondary", "warning"];

// pick a color from the project's id, so a project always keeps the same color
const toneFor = (seed = "") => {
  let hash = 0;
  for (const ch of String(seed)) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return TONES[Math.abs(hash) % TONES.length];
};

// Square project icon with the first letters of the project key (like Jira)
const ProjectAvatar = ({ project, size = 40, sx }) => {
  const { id, key = "", name = "" } = project;
  const tone = toneFor(id ?? key);
  const letters = (key || name).slice(0, 2).toUpperCase();

  return (
    <Avatar
      variant="rounded"
      sx={(theme) => ({
        width: size,
        height: size,
        borderRadius: 1.5,
        fontSize: size * 0.36,
        fontWeight: 700,
        bgcolor: alpha(theme.palette[tone].main, 0.15),
        color: "text.primary",
        ...sx,
      })}
    >
      {letters}
    </Avatar>
  );
};

export default ProjectAvatar;

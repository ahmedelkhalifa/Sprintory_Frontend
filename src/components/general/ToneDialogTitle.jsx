import { Box, DialogTitle } from "@mui/material";
import { alpha } from "@mui/material/styles";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

// the palette color and default icon of each tone
const TONES = {
  danger: { color: "error", Icon: DeleteOutlineRoundedIcon },
  warning: { color: "warning", Icon: WarningAmberRoundedIcon },
};

// A dialog title that says how serious the action is: `tone` "danger" (it removes something: red) or "warning"
// (allowed, but think twice: amber) adds a round tinted badge with an icon in front; no tone is a plain title.
// `Icon` replaces the tone's default icon (e.g. a person for "remove member").
const ToneDialogTitle = ({ tone, Icon, children }) => {
  const style = TONES[tone];
  if (!style) return <DialogTitle sx={{ fontWeight: 700 }}>{children}</DialogTitle>;
  const Shown = Icon ?? style.Icon;

  return (
    <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box
        aria-hidden
        sx={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: `${style.color}.main`,
          bgcolor: (theme) => alpha(theme.palette[style.color].main, 0.14),
        }}
      >
        <Shown fontSize="small" />
      </Box>
      <Box component="span" sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
        {children}
      </Box>
    </DialogTitle>
  );
};

export default ToneDialogTitle;

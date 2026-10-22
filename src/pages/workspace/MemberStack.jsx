import { Avatar, Box } from "@mui/material";

const TONES = ["primary", "success", "warning"];
const INITIALS = ["AM", "SC", "JD"];

// TODO: подставить реальных участников из API
function MemberStack({ count }) {
    const extra = Math.max(count - 3, 0);
    const avatarSx = (i, bg) => (theme) => ({
        width: 28, height: 28, fontSize: 11, ml: i ? -1 : 0,
        border: 2, borderColor: "background.paper",
        bgcolor: bg(theme), color: "common.white",
    });

    return (
        <Box sx={{ display: "flex", alignItems: "center" }}>
            {INITIALS.map((l, i) => (
                <Avatar key={l} sx={avatarSx(i, (t) => t.palette[TONES[i]].main)}>{l}</Avatar>
            ))}
            {extra > 0 && (
                <Avatar sx={{ ...avatarSx(3, () => "transparent"), bgcolor: "background.default", color: "text.secondary" }}>
                    +{extra}
                </Avatar>
            )}
        </Box>
    );
}

export default MemberStack;
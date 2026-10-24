import { Avatar, Box } from "@mui/material";

const TONES = ["primary", "success", "warning"];
const FAKE_INITIALS = ["AM", "SC", "JD"];

function MemberStack({ count = 0, members, total }) {
    const letters = members
        ? members.map((m) => `${m.firstName?.[0] ?? ""}${m.lastName?.[0] ?? ""}`.toUpperCase())
        : FAKE_INITIALS;
    const all = members ? total : count;
    const extra = Math.max(all - letters.length, 0);

    const avatarSx = (i, bg) => (theme) => ({
        width: 28, height: 28, fontSize: 11, ml: i ? -1 : 0,
        border: 2, borderColor: "background.paper",
        bgcolor: bg(theme), color: "common.white",
    });

    return (
        <Box sx={{ display: "flex", alignItems: "center" }}>
            {letters.map((l, i) => (
                <Avatar key={i} sx={avatarSx(i, (t) => t.palette[TONES[i % TONES.length]].main)}>{l}</Avatar>
            ))}
            {extra > 0 && (
                <Avatar sx={{ ...avatarSx(letters.length, () => "transparent"), bgcolor: "background.default", color: "text.secondary" }}>
                    +{extra}
                </Avatar>
            )}
        </Box>
    );
}

export default MemberStack;
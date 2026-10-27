import { Avatar, Box } from "@mui/material";
import { initials, memberLabel } from "../../utils/people";

const TONES = ["primary", "success", "warning"];

const avatarSx = (index) => ({
  width: 28,
  height: 28,
  fontSize: 11,
  ml: index ? -1 : 0,
  border: 2,
  borderColor: "background.paper",
});

// overlapping avatars for the first few members, then "+N" for the rest
const MemberStack = ({ members = [], total = 0 }) => {
  const extra = Math.max(total - members.length, 0);

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      {members.map((member, i) => (
        <Avatar
          key={member.userId}
          sx={{ ...avatarSx(i), bgcolor: `${TONES[i % TONES.length]}.main`, color: "common.white" }}
        >
          {initials(memberLabel(member))}
        </Avatar>
      ))}
      {extra > 0 && (
        <Avatar sx={{ ...avatarSx(members.length), bgcolor: "background.default", color: "text.secondary" }}>
          +{extra}
        </Avatar>
      )}
    </Box>
  );
};

export default MemberStack;

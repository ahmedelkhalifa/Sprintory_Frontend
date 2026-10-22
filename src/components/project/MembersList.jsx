import { Box, Card, Chip, Divider, Typography } from "@mui/material";
import MemberItem from "./MemberItem.jsx";

/**
 * @param {{ members: Array<{ id: string|number, name: string, email: string, role: string }> }} props
 */
const MembersList = ({ members = [] }) => {
  return (
    <Card sx={{ overflow: "hidden" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 3, py: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Members
        </Typography>
        <Chip
          label={members.length}
          size="small"
          sx={{ bgcolor: "#E6EEF6", color: "#203B5B", fontWeight: 600 }}
        />
      </Box>
      <Divider />

      {members.map((member, index) => (
        <Box key={member.id}>
          {index > 0 && <Divider sx={{ mx: 3 }} />}
          <MemberItem member={member} />
        </Box>
      ))}
    </Card>
  );
};

export default MembersList;

import { Box } from "@mui/material";
import ProjectHeader from "../components/project/ProjectHeader";
import MembersList from "../components/project/MembersList";

const members = [
  { id: 1, name: "Alex Johnson", email: "alex@sprintory.com", role: "ADMIN" },
  { id: 2, name: "Mobeen Khan", email: "mobeen@sprintory.com", role: "MEMBER" },
  { id: 3, name: "Sara Lee", email: "sara@sprintory.com", role: "VIEWER" },
];

export default function ProjectPreview() {
  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 4 }}>
      <ProjectHeader project={{ name: "Sprintory Platform", key: "SPR", description: "Main product project." }} />
      <MembersList members={members} />
    </Box>
  );
}
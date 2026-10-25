import { Box, Paper, Typography } from "@mui/material";
import ConstructionOutlinedIcon from "@mui/icons-material/ConstructionOutlined";

// Placeholder for a project tab whose feature isn't built yet (backlog, sprints, reports, files, settings)
const ComingSoonPanel = ({ title }) => (
  <Paper
    elevation={0}
    sx={{ p: { xs: 4, sm: 6 }, textAlign: "center", border: "1px solid", borderColor: "divider", borderRadius: 2 }}
  >
    <Box
      sx={{
        width: 56,
        height: 56,
        mx: "auto",
        mb: 2,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "navActive.background",
        color: "navActive.text",
      }}
    >
      <ConstructionOutlinedIcon />
    </Box>
    <Typography variant="h6" sx={{ fontWeight: 700 }}>
      {title} is coming soon
    </Typography>
    <Typography color="text.secondary" sx={{ mt: 0.5 }}>
      We're still building this part of the project. Check back later.
    </Typography>
  </Paper>
);

export default ComingSoonPanel;

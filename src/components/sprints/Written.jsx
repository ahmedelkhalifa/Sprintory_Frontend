import { Box, Typography } from "@mui/material";

// a labelled block of text the team wrote (a sprint's goal, the close note, the cancel reason), kept as typed
const Written = ({ label, children }) => (
  <Box>
    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
      {label}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
      {children}
    </Typography>
  </Box>
);

export default Written;

import { Link as RouterLink } from "react-router-dom";
import { Button, Paper, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// Shown when a workspace or project returns 404. The backend answers the same for
// "doesn't exist" and "you can't see it" (e.g. you were just removed), so the text never says which.
const NotFound = ({ title, backTo, backLabel }) => (
  <Paper
    elevation={0}
    sx={{ maxWidth: 520, mx: "auto", mt: { xs: 2, sm: 6 }, p: { xs: 3, sm: 5 }, textAlign: "center",
      border: "1px solid", borderColor: "divider", borderRadius: 2 }}
  >
    <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
      {title}
    </Typography>
    <Typography sx={{ mt: 1, mb: 3, color: "text.secondary" }}>
      It doesn't exist, or you don't have access to it anymore.
    </Typography>
    <Button component={RouterLink} to={backTo} variant="contained" startIcon={<ArrowBackIcon />}>
      {backLabel}
    </Button>
  </Paper>
);

export default NotFound;

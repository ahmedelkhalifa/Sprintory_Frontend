import { Paper, Typography } from "@mui/material";
import { SHORT_SCREEN } from "../../theme/media";

// White card with a title and subtitle that wraps the auth forms
const AuthCard = ({ title, subtitle, children }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        maxWidth: 520,
        px: { xs: 2.5, sm: 5 },
        py: { xs: 3, sm: 4 },
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2, // 2 x theme.shape.borderRadius = 16px
        [SHORT_SCREEN]: { py: 2.5 },
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{
          fontWeight: 700,
          letterSpacing: "-0.02em",
          fontSize: { xs: 26, sm: 30 },
          [SHORT_SCREEN]: { fontSize: 26 },
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          sx={{
            mt: 0.5,
            mb: 2.5,
            color: "text.secondary",
            fontSize: 15,
            [SHORT_SCREEN]: { mb: 2 },
          }}
        >
          {subtitle}
        </Typography>
      )}
      {children}
    </Paper>
  );
};

export default AuthCard;

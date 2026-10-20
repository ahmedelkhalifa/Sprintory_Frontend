import { Box, Typography } from "@mui/material";
import Logo from "../general/Logo";
import { SHORT_SCREEN } from "../../theme/media";

// Left side of the auth pages: stock photo with the marketing text on top
const AuthHero = () => {
  return (
    <Box
      sx={{
        position: "relative",
        height: "100%",
        px: { md: 6, lg: 10 },
        py: { md: 6, lg: 7 },
        backgroundImage: "url(/signup.png)",
        backgroundSize: "cover",
        backgroundPosition: "right bottom",
        [SHORT_SCREEN]: { py: 4 },
        // cream fade from the top-left so the dark text stays readable
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(160deg, rgba(247,245,239,0.85) 0%, rgba(247,245,239,0.55) 40%, rgba(247,245,239,0) 65%)",
        },
      }}
    >
      <Box sx={{ position: "relative", maxWidth: 560 }}>
        <Logo size={32} />

        <Typography
          sx={{
            mt: { md: 10, lg: 14 },
            mb: 3,
            [SHORT_SCREEN]: { mt: 5, mb: 2 },
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "0.3em",
            color: "text.secondary",
          }}
        >
          PLAN. COLLABORATE. DELIVER.
        </Typography>

        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            fontSize: { md: 44, lg: 56 },
            color: "text.primary",
          }}
        >
          Turn ideas into{" "}
          <Box component="span" sx={{ color: "primary.main", display: "block" }}>
            successful projects
          </Box>
        </Typography>

        <Typography
          sx={{ mt: 3, fontSize: { md: 17, lg: 19 }, lineHeight: 1.6, color: "text.secondary" }}
        >
          Sprintory helps teams plan, collaborate, and deliver with clarity. From
          tasks and sprints to powerful AI insights, everything you need to move
          your projects forward — in one place.
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthHero;

import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import Logo from "../general/Logo";
import { SHORT_SCREEN } from "../../theme/media";

const layer = { position: "absolute", inset: 0 };

// Left side of the auth pages: a photo / pattern with the marketing text on top
// image: each auth page can show its own picture (the text sits on its left part)
const AuthHero = ({ image = "/images/signup.png" }) => {
  return (
    <Box
      sx={{
        position: "relative",
        isolation: "isolate",
        height: "100%",
        px: { md: 6, lg: 10 },
        py: { md: 6, lg: 7 },
        bgcolor: "hero.background",
        [SHORT_SCREEN]: { py: 4 },
      }}
    >
      {/* multiplied onto hero.background: unchanged on white (light mode),
          a dark navy version of the same picture in dark mode */}
      <Box
        aria-hidden
        sx={{
          ...layer,
          zIndex: -2,
          backgroundImage: `url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "right bottom",
          mixBlendMode: "multiply",
        }}
      />
      {/* the page color fading out to the right, so the text sits on an almost plain background */}
      <Box
        aria-hidden
        sx={{
          ...layer,
          zIndex: -1,
          background: (theme) => {
            const page = theme.palette.background.default;
            return `linear-gradient(90deg, ${alpha(page, 0.92)} 0%, ${alpha(page, 0.82)} 50%, ${alpha(page, 0.2)} 85%, ${alpha(page, 0)} 100%)`;
          },
        }}
      />

      <Box sx={{ maxWidth: 560 }}>
        <Logo size={32} />

        <Typography
          sx={{
            mt: { md: 10, lg: 14 },
            mb: 3,
            [SHORT_SCREEN]: { mt: 5, mb: 2 },
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.3em",
            color: "primary.main",
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

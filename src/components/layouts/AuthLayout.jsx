import { Box } from "@mui/material";
import AuthHero from "../auth/AuthHero";
import Logo from "../general/Logo";
import LanguageSelect from "../general/LanguageSelect";

// Split screen shell for the auth pages (register, login, ...)
// desktop: photo on the left, form on the right
// mobile/tablet: photo hidden, logo on top, form below
// The page is exactly one screen tall (100dvh). If the form ever doesn't fit
// (small laptop, phone), only the form column scrolls, never the whole page.
const AuthLayout = ({ children }) => {
  return (
    <Box
      sx={{
        height: "100dvh",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.15fr 1fr" },
        bgcolor: "background.default",
      }}
    >
      <Box sx={{ display: { xs: "none", md: "block" }, minHeight: 0 }}>
        <AuthHero />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          minHeight: 0,
          overflowY: "auto",
        }}
      >
        {/* top bar: logo only shows when the hero is hidden */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: { xs: "space-between", md: "flex-end" },
            px: { xs: 2, sm: 4, lg: 6 },
            pt: 2,
          }}
        >
          <Box sx={{ display: { xs: "block", md: "none" } }}>
            <Logo size={24} />
          </Box>
          <LanguageSelect />
        </Box>

        {/* my: auto centres the card vertically but still lets it scroll
            from the top when it's taller than the space (alignItems would cut it off) */}
        <Box
          sx={{
            my: "auto",
            display: "flex",
            justifyContent: "center",
            px: { xs: 2, sm: 4, lg: 6 },
            py: { xs: 3, md: 1.5 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AuthLayout;

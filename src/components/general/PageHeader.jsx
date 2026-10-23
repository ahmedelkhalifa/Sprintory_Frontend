import { Box, Typography } from "@mui/material";

// Top of an app page: optional breadcrumb, then an optional avatar/icon,
// the title, a subtitle, and optional actions (buttons) on the right
const PageHeader = ({ title, subtitle, breadcrumb, avatar, actions }) => {
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumb && <Box sx={{ mb: 2 }}>{breadcrumb}</Box>}

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { sm: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
          {avatar}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 700, letterSpacing: "-0.02em", fontSize: { xs: 26, sm: 30 } }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: 15 }}>{subtitle}</Typography>
            )}
          </Box>
        </Box>

        {actions && <Box sx={{ display: "flex", gap: 1.5, flexShrink: 0 }}>{actions}</Box>}
      </Box>
    </Box>
  );
};

export default PageHeader;

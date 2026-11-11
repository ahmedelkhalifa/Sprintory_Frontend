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
            {/* the theme's page-title size (h4); phones a step smaller */}
            <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 20, sm: 24 } }}>
              {title}
            </Typography>
            {/* text goes in a paragraph; anything else (e.g. chips) in a plain box */}
            {subtitle &&
              (typeof subtitle === "string" ? (
                <Typography sx={{ mt: 0.5, color: "text.secondary" }}>{subtitle}</Typography>
              ) : (
                <Box sx={{ mt: 0.75 }}>{subtitle}</Box>
              ))}
          </Box>
        </Box>

        {/* phones: the buttons sit under the title and wrap onto more rows instead of squeezing */}
        {actions && <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, flexShrink: { sm: 0 } }}>{actions}</Box>}
      </Box>
    </Box>
  );
};

export default PageHeader;

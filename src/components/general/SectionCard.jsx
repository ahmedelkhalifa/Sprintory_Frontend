import { Box, Chip, Divider, Paper, Typography } from "@mui/material";

// White bordered card for a page section: a title with an optional count (or a custom `header`, e.g. tabs),
// an optional toolbar on the right (e.g. a search field), then the content
const SectionCard = ({ title, count, header, toolbar, children }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        boxShadow: 1, // the theme's soft card shadow
        borderRadius: 2, // 2 x theme.shape.borderRadius = 16px
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { sm: "center" },
          justifyContent: "space-between",
          gap: 2,
          px: { xs: 2, sm: 3 },
          py: 2,
        }}
      >
        {header ?? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            {count !== undefined && (
              <Chip
                label={count}
                size="small"
                sx={{ bgcolor: "navActive.background", color: "navActive.text", fontWeight: 600 }}
              />
            )}
          </Box>
        )}
        {toolbar}
      </Box>

      <Divider />
      {children}
    </Paper>
  );
};

export default SectionCard;

import { Box, Chip, Divider, Paper, Typography } from "@mui/material";

// White bordered card for a page section: a title with an optional count,
// an optional toolbar on the right (e.g. a search field), then the content
const SectionCard = ({ title, count, toolbar, children }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
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
        {toolbar}
      </Box>

      <Divider />
      {children}
    </Paper>
  );
};

export default SectionCard;

import { Box, Chip, Divider, Paper, Typography } from "@mui/material";

// Bordered white section of a page: a title with an optional count (or a custom `header`, e.g. tabs),
// an optional toolbar on the right (e.g. a search field), then the content. Flat: a hairline, no shadow.
const SectionCard = ({ title, count, header, toolbar, children }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2, // 2 x theme.shape.borderRadius = 6px
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { sm: "center" },
          justifyContent: "space-between",
          gap: 1.5,
          px: { xs: 2, sm: 2.5 },
          minHeight: 56,
          py: 1.25,
        }}
      >
        {header ?? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6" component="h2">
              {title}
            </Typography>
            {count !== undefined && (
              // a neutral count, like Jira's: colour stays for state and actions
              <Chip
                label={count}
                size="small"
                sx={{ height: 20, bgcolor: "action.selected", color: "text.secondary", fontWeight: 600 }}
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

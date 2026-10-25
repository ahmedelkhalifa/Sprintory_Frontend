import { Box, Paper, Typography } from "@mui/material";

// White card used on the overview: an icon + title on the left, an optional action on the right, then the content
const OverviewCard = ({ Icon, title, action, children, sx }) => (
  <Paper
    elevation={0}
    sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden", ...sx }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        px: { xs: 2, sm: 2.5 },
        py: 1.75,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
        <Icon fontSize="small" sx={{ color: "text.secondary" }} />
        <Typography component="h2" sx={{ fontWeight: 700, fontSize: 17 }} noWrap>
          {title}
        </Typography>
      </Box>
      {action}
    </Box>
    {children}
  </Paper>
);

export default OverviewCard;

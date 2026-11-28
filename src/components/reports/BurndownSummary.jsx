import { Box, Paper, Typography } from "@mui/material";
import { formatAmount, signed } from "../../utils/burndown";

const BurndownSummary = ({ summary }) => {
  const scope = summary.scopeChange
    ? `${formatAmount(summary.currentScope)} (${signed(summary.scopeChange)})`
    : formatAmount(summary.currentScope);
  const items = [
    ["Committed", formatAmount(summary.committed)],
    ["Scope", scope],
    ["Done", formatAmount(summary.done)],
    ["Remaining", formatAmount(summary.remaining)],
    ["Days left", formatAmount(summary.daysLeft)],
  ];

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 1.5 }}>
      {items.map(([label, value]) => (
        <Paper key={label} variant="outlined" sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography variant="h6" component="p">{value}</Typography>
        </Paper>
      ))}
    </Box>
  );
};

export default BurndownSummary;

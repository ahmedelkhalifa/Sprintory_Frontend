import { Box, Paper, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  chartRows,
  dayLabel,
  formatAmount,
  scopeChangeText,
  todayIndex,
  weekendBands,
} from "../../utils/burndown";

const DayTooltip = ({ active, payload, dates, unit }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const change = scopeChangeText(row.scopeChange, unit);

  return (
    <Paper variant="outlined" sx={{ px: 1.5, py: 1 }}>
      <Typography variant="subtitle2">{dayLabel(dates, row.index)}</Typography>
      {row.actual != null && <Typography variant="body2">Actual: {formatAmount(row.actual)}</Typography>}
      {row.ideal != null && <Typography variant="body2">Ideal: {formatAmount(row.ideal)}</Typography>}
      {change && <Typography variant="body2">Scope change: {change}</Typography>}
    </Paper>
  );
};

const BurndownChart = ({ burndown }) => {
  const { palette } = useTheme();
  const { dates, unit, days, today, sprintStatus } = burndown;
  const rows = chartRows(burndown);
  const marker = sprintStatus === "ACTIVE" ? todayIndex(dates, today) : null;
  const axisProps = { stroke: palette.divider, tick: { fill: palette.text.secondary, fontSize: 12 } };

  return (
    <Box sx={{ height: 360, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 20, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={palette.divider} vertical={false} />
          {days === "WORKING" &&
            weekendBands(dates).map((band) => (
              <ReferenceArea key={band.from} x1={band.from} x2={band.to} fill={palette.action.hover} fillOpacity={1} strokeOpacity={0} />
            ))}
          <XAxis
            {...axisProps}
            dataKey="index"
            type="number"
            domain={[0, dates.length - 1]}
            ticks={rows.map((row) => row.index)}
            tickFormatter={(index) => dayLabel(dates, index)}
            interval="preserveStartEnd"
            minTickGap={12}
          />
          <YAxis {...axisProps} width={40} domain={[0, "auto"]} allowDecimals={false} />
          <Tooltip content={<DayTooltip dates={dates} unit={unit} />} />
          <Legend />
          {marker != null && (
            <ReferenceLine x={marker} stroke={palette.warning.main} label={{ value: "Today", position: "top", fill: palette.text.secondary, fontSize: 12 }} />
          )}
          <Line dataKey="ideal" name="Ideal" stroke={palette.text.secondary} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
          <Line dataKey="actual" name="Actual" stroke={palette.primary.main} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default BurndownChart;

import { memo, useId } from "react";
import { useTheme } from "@mui/material/styles";

// The dependency arrows (PMP-48 AC 8, 17), one SVG under the bars: from the end of the blocker's bar to the start of
// the blocked task's (paths from timelineLayout). A conflict's arrow is red and thicker. Colors come from the theme,
// so both modes work; the arrowheads are markers, one per color.
const TimelineArrows = memo(({ arrows, width, height }) => {
  const theme = useTheme();
  const id = useId();
  const normal = theme.palette.text.secondary;
  const conflict = theme.palette.error.main;

  return (
    <svg
      width={width}
      height={height}
      aria-hidden="true"
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", overflow: "visible" }}
    >
      <defs>
        {[
          ["n", normal],
          ["c", conflict],
        ].map(([kind, color]) => (
          <marker key={kind} id={`${id}${kind}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 z" fill={color} />
          </marker>
        ))}
      </defs>
      {/* the conflicts last, so they draw over the others */}
      {[...arrows]
        .sort((a, b) => Number(a.conflict) - Number(b.conflict))
        .map((arrow) => (
          <path
            key={arrow.id}
            d={arrow.d}
            fill="none"
            stroke={arrow.conflict ? conflict : normal}
            strokeOpacity={arrow.conflict ? 1 : 0.6}
            strokeWidth={arrow.conflict ? 2 : 1.25}
            strokeLinejoin="round"
            markerEnd={`url(#${id}${arrow.conflict ? "c" : "n"})`}
          />
        ))}
    </svg>
  );
});

export default TimelineArrows;

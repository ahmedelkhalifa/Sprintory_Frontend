import { Box, Skeleton } from "@mui/material";

// skeleton of the project header and the stat cards while the project loads
const ProjectSkeleton = () => (
  <Box>
    <Skeleton width={140} />
    <Box sx={{ display: "flex", gap: 2.5, alignItems: "center", mt: 2, mb: 4 }}>
      <Skeleton variant="rounded" width={72} height={72} />
      <Box sx={{ flex: 1 }}>
        <Skeleton width="40%" height={40} />
        <Skeleton width="60%" />
      </Box>
    </Box>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2 }}>
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} variant="rounded" height={96} />
      ))}
    </Box>
  </Box>
);

export default ProjectSkeleton;

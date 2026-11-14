import { Alert, Box, Button, Skeleton, Stack, Typography } from "@mui/material";
import { FADE_IN_SX, LOADING_DELAY_SX } from "../../theme/motion";

// the empty message fades in where the skeleton was instead of popping
const settleSx = FADE_IN_SX;

// Shows the right state of a loaded section, in this order:
// loading -> skeleton rows, error -> message + "Try again", empty -> message, otherwise -> children
const LoadState = ({ loading, error, onRetry, isEmpty, emptyMessage = "Nothing here yet.", rows = 4, children }) => {
  if (loading) {
    return (
      // shows only if loading takes more than 200ms (a quick load never flashes it)
      <Stack spacing={1.5} sx={{ p: { xs: 2, sm: 3 }, ...LOADING_DELAY_SX }} aria-busy="true">
        {Array.from({ length: rows }, (_, i) => (
          <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Skeleton variant="rounded" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="40%" />
              <Skeleton width="25%" />
            </Box>
          </Box>
        ))}
      </Stack>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Alert
          severity="error"
          action={
            onRetry && (
              <Button color="inherit" size="small" onClick={onRetry}>
                Try again
              </Button>
            )
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (isEmpty) {
    return (
      <Typography sx={{ p: { xs: 3, sm: 4 }, textAlign: "center", color: "text.secondary", ...settleSx }}>
        {emptyMessage}
      </Typography>
    );
  }

  // returned as is: callers lay the children out themselves (flex columns, tables), so no wrapper here
  return children;
};

export default LoadState;

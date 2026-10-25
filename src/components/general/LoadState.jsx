import { Alert, Box, Button, Skeleton, Stack, Typography } from "@mui/material";

// Shows the right state of a loaded section, in this order:
// loading -> skeleton rows, error -> message + "Try again", empty -> message, otherwise -> children
const LoadState = ({ loading, error, onRetry, isEmpty, emptyMessage = "Nothing here yet.", rows = 4, children }) => {
  if (loading) {
    return (
      <Stack spacing={1.5} sx={{ p: { xs: 2, sm: 3 } }} aria-busy="true">
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
      <Typography sx={{ p: { xs: 3, sm: 5 }, textAlign: "center", color: "text.secondary" }}>
        {emptyMessage}
      </Typography>
    );
  }

  return children;
};

export default LoadState;

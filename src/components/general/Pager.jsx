import { Box, Pagination, Typography } from "@mui/material";

// Footer of a paginated list: "Showing 1–20 of 45 projects" and the page buttons.
// `noun` is singular ("project"); `page` is 0-based like the backend, MUI's Pagination counts from 1.
const Pager = ({ page, size, total, totalPages, shown, noun = "item", onPageChange }) => {
  if (total === 0) return null;
  const from = page * size + 1;
  const to = page * size + shown;
  const range = from === to ? `${from}` : `${from}–${to}`;
  const label = total === 1 ? noun : `${noun}s`;

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        px: { xs: 2, sm: 3 },
        py: 1.5,
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Showing {range} of {total} {label}
      </Typography>
      {totalPages > 1 && (
        <Pagination
          count={totalPages}
          page={page + 1}
          onChange={(_, value) => onPageChange(value - 1)}
          shape="rounded"
          color="primary"
          size="small"
        />
      )}
    </Box>
  );
};

export default Pager;

import { Box, FormLabel } from "@mui/material";

// one row of a task page's Details card: the label on the left, the field on the right
const DetailRow = ({ id, label, children }) => (
  <Box sx={{ display: "grid", gridTemplateColumns: "110px minmax(0, 1fr)", alignItems: "start", gap: 1, py: 0.75 }}>
    <FormLabel htmlFor={id} sx={{ pt: 1.25, fontSize: 14, color: "text.secondary" }}>
      {label}
    </FormLabel>
    <Box sx={{ minWidth: 0 }}>{children}</Box>
  </Box>
);

export default DetailRow;

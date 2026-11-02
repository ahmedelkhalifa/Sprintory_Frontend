import { Box, Button, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { MAX_COLUMNS } from "../../utils/board";

// The dashed "Add column" box after the board's last column, for people who configure the board.
// Off (with the reason on hover) once the board has the most columns it can.
const AddColumnButton = ({ full, onClick }) => (
  <Tooltip title={full ? `A board can have at most ${MAX_COLUMNS} columns` : ""}>
    {/* a wrapper, so the tooltip still shows on a disabled button */}
    <Box sx={{ flexShrink: 0, alignSelf: "flex-start" }}>
      <Button
        variant="outlined"
        color="inherit"
        startIcon={<AddIcon />}
        disabled={full}
        onClick={onClick}
        sx={{
          width: 200,
          height: 50,
          justifyContent: "flex-start",
          px: 2,
          borderStyle: "dashed",
          borderColor: "divider",
          borderRadius: 2,
          color: "text.secondary",
          "&:hover": { borderStyle: "dashed", borderColor: "primary.main", color: "primary.main" },
        }}
      >
        Add column
      </Button>
    </Box>
  </Tooltip>
);

export default AddColumnButton;

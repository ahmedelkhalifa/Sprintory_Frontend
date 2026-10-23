import { Divider, Typography } from "@mui/material";
import { SHORT_SCREEN } from "../../theme/media";

const OrDivider = () => {
  return (
    <Divider sx={{ my: 1.5, [SHORT_SCREEN]: { my: 1 } }}>
      <Typography variant="body2" sx={{ color: "text.secondary", px: 1 }}>
        or
      </Typography>
    </Divider>
  );
};

export default OrDivider;

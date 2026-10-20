import { Button } from "@mui/material";
import { FcGoogle } from "react-icons/fc";

const GoogleButton = ({ onClick, children = "Continue with Google" }) => {
  return (
    <Button
      fullWidth
      variant="outlined"
      startIcon={<FcGoogle />}
      onClick={onClick}
      sx={{
        py: 1,
        color: "text.primary",
        borderColor: "divider",
        bgcolor: "background.paper",
        "&:hover": { borderColor: "primary.light", bgcolor: "background.paper" },
      }}
    >
      {children}
    </Button>
  );
};

export default GoogleButton;

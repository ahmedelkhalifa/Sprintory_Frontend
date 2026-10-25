import { useState } from "react";
import { IconButton, InputAdornment } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import FormField from "./FormField";

// Password input with a show/hide toggle
const PasswordField = (props) => {
  const [visible, setVisible] = useState(false);

  return (
    <FormField
      {...props}
      type={visible ? "text" : "password"}
      icon={<LockOutlinedIcon fontSize="small" />}
      endAdornment={
        <InputAdornment position="end">
          <IconButton
            edge="end"
            aria-label={visible ? "Hide password" : "Show password"}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
          </IconButton>
        </InputAdornment>
      }
    />
  );
};

export default PasswordField;

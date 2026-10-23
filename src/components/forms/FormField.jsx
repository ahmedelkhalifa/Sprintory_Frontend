import { Box, FormLabel, InputAdornment, TextField } from "@mui/material";
import { SHORT_SCREEN } from "../../theme/media";

// TextField with the label above it (instead of MUI's floating label)
// and an optional icon at the start of the input
const FormField = ({ id, label, icon, endAdornment, sx, ...textFieldProps }) => {
  return (
    <Box sx={{ width: "100%", ...sx }}>
      <FormLabel
        htmlFor={id}
        sx={{ display: "block", mb: 0.5, fontSize: 14, fontWeight: 500, color: "text.primary" }}
      >
        {label}
      </FormLabel>
      <TextField
        id={id}
        fullWidth
        {...textFieldProps}
        slotProps={{
          input: {
            startAdornment: icon && (
              <InputAdornment position="start" sx={{ color: "text.secondary" }}>
                {icon}
              </InputAdornment>
            ),
            endAdornment,
          },
        }}
        sx={{
          "& .MuiOutlinedInput-root": { bgcolor: "background.paper" },
          "& .MuiOutlinedInput-input": { py: 1.25 }, // ~44px tall (MUI default is 56px)
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" },
          [SHORT_SCREEN]: { "& .MuiOutlinedInput-input": { py: 1 } },
        }}
      />
    </Box>
  );
};

export default FormField;

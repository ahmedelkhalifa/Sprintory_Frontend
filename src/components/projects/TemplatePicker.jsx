import { Box, ButtonBase, FormLabel, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { TEMPLATES } from "../../constants/projects";

// Scrum / Kanban choice as two cards (a radio group). The template can't be changed after creation.
const TemplatePicker = ({ value, onChange }) => {
  return (
    <Box>
      <FormLabel id="template-label" sx={{ display: "block", mb: 0.5, fontSize: 14, fontWeight: 500, color: "text.primary" }}>
        Template
      </FormLabel>
      <Box
        role="radiogroup"
        aria-labelledby="template-label"
        sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}
      >
        {Object.values(TEMPLATES).map((template) => {
          const selected = value === template.value;
          return (
            <ButtonBase
              key={template.value}
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(template.value)}
              sx={{
                display: "block",
                textAlign: "left",
                p: 1.75,
                borderRadius: 2,
                border: "2px solid",
                borderColor: selected ? "primary.main" : "divider",
                bgcolor: selected ? "navActive.background" : "background.paper",
                transition: "border-color 0.15s, background-color 0.15s",
                "&:hover": { borderColor: selected ? "primary.main" : "primary.light" },
                "&.Mui-focusVisible": { borderColor: "primary.main" },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography sx={{ fontWeight: 700 }}>{template.label}</Typography>
                {selected && <CheckCircleIcon fontSize="small" sx={{ color: "primary.main" }} />}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {template.description}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
        You can't change the template later.
      </Typography>
    </Box>
  );
};

export default TemplatePicker;

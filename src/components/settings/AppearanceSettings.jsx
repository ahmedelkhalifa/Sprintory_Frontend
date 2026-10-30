import { Box, Radio, RadioGroup, Typography } from "@mui/material";
import { DarkModeOutlined, LightModeOutlined, SettingsBrightnessOutlined } from "@mui/icons-material";
import SectionCard from "../general/SectionCard";
import { useColorMode } from "../../context/ColorModeContext";

const OPTIONS = [
  { value: "light", label: "Light", description: "Light backgrounds with dark text.", Icon: LightModeOutlined },
  { value: "dark", label: "Dark", description: "Dark backgrounds, easier on the eyes at night.", Icon: DarkModeOutlined },
  {
    value: "system",
    label: "System",
    description: "Follows your device's light or dark setting.",
    Icon: SettingsBrightnessOutlined,
  },
];

// The color mode picker: Light / Dark / System as selectable cards. Applies at once and is kept in this browser.
const AppearanceSettings = () => {
  const { mode, setMode } = useColorMode();

  return (
    <SectionCard title="Appearance">
      <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
        <Typography id="color-mode-label" sx={{ fontWeight: 600 }}>
          Theme
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose how Sprintory looks. Saved in this browser.
        </Typography>

        <RadioGroup
          aria-labelledby="color-mode-label"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}
        >
          {OPTIONS.map(({ value, label, description, Icon }) => {
            const selected = value === mode;
            return (
              <Box
                key={value}
                component="label"
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                  p: 2,
                  border: 1,
                  borderColor: selected ? "primary.main" : "divider",
                  borderRadius: 2,
                  bgcolor: selected ? "navActive.background" : "transparent",
                  cursor: "pointer",
                  transition: "border-color 0.15s, background-color 0.15s",
                  "&:hover": { borderColor: selected ? "primary.main" : "text.disabled" },
                }}
              >
                <Radio value={value} size="small" sx={{ p: 0, mt: 0.25 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Icon fontSize="small" sx={{ color: selected ? "navActive.text" : "text.secondary" }} />
                    <Typography sx={{ fontWeight: 600 }}>{label}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {description}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </RadioGroup>
      </Box>
    </SectionCard>
  );
};

export default AppearanceSettings;

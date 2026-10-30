import { Stack, Typography } from "@mui/material";
import PageLayout from "../../components/layouts/PageLayout";
import AppearanceSettings from "../../components/settings/AppearanceSettings";

// /settings: the user's own preferences (for now only the color mode)
const SettingsPage = () => (
  <PageLayout>
    <Typography component="h1" variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.04em" }}>
      Settings
    </Typography>
    <Typography color="text.secondary" sx={{ mt: 0.75, mb: 3 }}>
      Your personal preferences.
    </Typography>
    <Stack spacing={2.5}>
      <AppearanceSettings />
    </Stack>
  </PageLayout>
);

export default SettingsPage;

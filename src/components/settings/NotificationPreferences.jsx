import { useState } from "react";
import {
  Alert, Button, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography,
} from "@mui/material";
import LoadState from "../general/LoadState";
import SectionCard from "../general/SectionCard";
import { getNotificationPreferences, updateNotificationPreferences } from "../../api/notificationsApi";
import { NOTIFICATION_CATEGORIES } from "../../constants/notifications";
import { useAsync } from "../../hooks/useAsync";
import { useSubmit } from "../../hooks/useSubmit";
import { preferenceDefaults, preferencesAtDefaults } from "../../utils/notification";

const CHANNELS = [
  { key: "inApp", label: "In-app" },
  { key: "email", label: "Email" },
];

// The category x channel switches (notifications-docs.md §6). They are the same in every workspace and saved on the
// account, unlike the color mode. Each switch saves at once (one change per PUT) and the page shows the matrix the
// backend returns; locked categories are always on.
const NotificationPreferences = () => {
  const loaded = useAsync((signal) => getNotificationPreferences(signal), [], {
    fallback: "Couldn't load your notification settings.",
  });
  const [saved, setSaved] = useState(null); // the matrix after the last change
  const save = useSubmit();
  const preferences = saved ?? loaded.data?.preferences ?? [];

  const apply = async (changes) => {
    const { ok, result } = await save.run(() => updateNotificationPreferences(changes));
    if (ok) setSaved(result.preferences);
  };

  const reset = (
    <Button
      variant="outlined"
      size="small"
      onClick={() => apply(preferenceDefaults(preferences))}
      disabled={loaded.loading || !preferences.length || save.submitting || preferencesAtDefaults(preferences)}
    >
      Reset to defaults
    </Button>
  );

  return (
    <SectionCard title="Notifications" toolbar={reset}>
      <Typography variant="body2" color="text.secondary" sx={{ px: { xs: 2, sm: 3 }, pt: 2 }}>
        Choose what you hear about, in the bell and by email. The same in every workspace.
      </Typography>

      {save.error && (
        <Alert severity="error" onClose={save.clearError} sx={{ mx: { xs: 2, sm: 3 }, mt: 2 }}>
          {save.error}
        </Alert>
      )}

      <LoadState
        loading={loaded.loading}
        error={loaded.error}
        onRetry={loaded.reload}
        isEmpty={!preferences.length}
        rows={3}
      >
        <TableContainer sx={{ px: { xs: 0, sm: 1 }, pb: 1 }}>
          <Table size="small" aria-label="Notification settings">
            <TableHead>
              <TableRow>
                <TableCell>Notify me about</TableCell>
                {CHANNELS.map((channel) => (
                  <TableCell key={channel.key} align="center" sx={{ width: { xs: 64, sm: 96 } }}>
                    {channel.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {preferences.map((pref) => {
                const category = NOTIFICATION_CATEGORIES[pref.category];
                const label = category?.label ?? pref.category;
                return (
                  <TableRow key={pref.category}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        {pref.locked ? "Always on. " : ""}
                        {category?.description}
                      </Typography>
                    </TableCell>
                    {CHANNELS.map((channel) => (
                      <TableCell key={channel.key} align="center">
                        {/* the span lets the tooltip show on a disabled switch */}
                        <Tooltip title={pref.locked ? "Always on, can't be turned off" : ""}>
                          <span>
                            <Switch
                              size="small"
                              checked={pref[channel.key]}
                              disabled={pref.locked || save.submitting}
                              onChange={(e) => apply([{ category: pref.category, [channel.key]: e.target.checked }])}
                              slotProps={{ input: { "aria-label": `${label}: ${channel.label}` } }}
                            />
                          </span>
                        </Tooltip>
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </LoadState>
    </SectionCard>
  );
};

export default NotificationPreferences;

import { useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormLabel,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import FormField from "../forms/FormField";
import LinkedUserPicker from "./LinkedUserPicker";
import { createStakeholder, updateStakeholder } from "../../api/charterApi";
import { useSubmit } from "../../hooks/useSubmit";
import {
  CHARTER_ERROR_MESSAGES,
  STAKEHOLDER_LEVELS,
  STAKEHOLDER_LEVEL_LABEL,
  STAKEHOLDER_ROLE_SUGGESTIONS,
} from "../../constants/charter";
import { charterFieldErrors, stakeholderRequest, stakeholderValues, validateStakeholder } from "../../utils/charter";

const FIELDS = ["name", "organization", "projectRole", "interest", "influence", "contactEmail", "linkedUserId"];

// the backend refuses a linked user from another workspace with a plain BAD_REQUEST
const MESSAGES = { ...CHARTER_ERROR_MESSAGES, BAD_REQUEST: "The linked user must be a member of this workspace." };

// FormField's label sits above the field and can't name a select's button, so the button gets its own name
const LevelField = ({ id, label, value, onChange }) => (
  <FormField
    id={id}
    label={label}
    select
    value={value}
    onChange={onChange}
    slotProps={{ select: { SelectDisplayProps: { "aria-label": label } } }}
  >
    <MenuItem value="">
      <em>Not set</em>
    </MenuItem>
    {STAKEHOLDER_LEVELS.map((level) => (
      <MenuItem key={level} value={level}>
        {STAKEHOLDER_LEVEL_LABEL[level]}
      </MenuItem>
    ))}
  </FormField>
);

// Add a stakeholder (`stakeholder` null) or edit one: a register entry for anyone with a stake in the project.
// They don't need an account (a sponsor or client may never log in); a workspace member can be linked optionally.
const StakeholderDialog = ({ projectId, workspaceId, stakeholder = null, onSaved, onClose }) => {
  const adding = stakeholder === null;
  const [values, setValues] = useState(stakeholderValues(stakeholder));
  const [errors, setErrors] = useState({});
  const submit = useSubmit(MESSAGES);

  const set = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    submit.clearError();
  };
  const change = (field) => (event) => set(field, event.target.value);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const problems = validateStakeholder(values);
    if (Object.keys(problems).length > 0) return setErrors(problems);

    const body = stakeholderRequest(values);
    const { ok, result, error } = await submit.run(() =>
      adding ? createStakeholder(projectId, body) : updateStakeholder(projectId, stakeholder.id, body),
    );
    if (ok) return onSaved(result);
    const fieldErrors = charterFieldErrors(error, FIELDS);
    if (fieldErrors) {
      setErrors(fieldErrors);
      submit.clearError();
    }
  };

  return (
    <Dialog open onClose={submit.submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" noValidate onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>{adding ? "Add stakeholder" : "Edit stakeholder"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <FormField
              id="stakeholder-name"
              label="Name"
              autoFocus
              required
              value={values.name}
              onChange={change("name")}
              error={Boolean(errors.name)}
              helperText={errors.name}
              placeholder="e.g. Acme Corp"
            />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <FormField
                id="stakeholder-organization"
                label="Organization"
                value={values.organization}
                onChange={change("organization")}
                error={Boolean(errors.organization)}
                helperText={errors.organization}
              />
              <Box>
                <FormLabel
                  htmlFor="stakeholder-role"
                  sx={{ display: "block", mb: 0.5, fontSize: 14, fontWeight: 500, color: "text.primary" }}
                >
                  Role in the project
                </FormLabel>
                <Autocomplete
                  id="stakeholder-role"
                  freeSolo
                  options={STAKEHOLDER_ROLE_SUGGESTIONS}
                  inputValue={values.projectRole}
                  onInputChange={(_, text) => set("projectRole", text)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="e.g. Sponsor"
                      error={Boolean(errors.projectRole)}
                      helperText={errors.projectRole}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "background.paper" } }}
                    />
                  )}
                />
              </Box>
              <LevelField id="stakeholder-interest" label="Interest" value={values.interest} onChange={change("interest")} />
              <LevelField id="stakeholder-influence" label="Influence" value={values.influence} onChange={change("influence")} />
            </Box>
            <FormField
              id="stakeholder-email"
              label="Contact email"
              type="email"
              value={values.contactEmail}
              onChange={change("contactEmail")}
              error={Boolean(errors.contactEmail)}
              helperText={errors.contactEmail || "Only project members can see it."}
            />
            <Box>
              <FormLabel
                htmlFor="stakeholder-linked-user"
                sx={{ display: "block", mb: 0.5, fontSize: 14, fontWeight: 500, color: "text.primary" }}
              >
                Linked workspace user (optional)
              </FormLabel>
              <LinkedUserPicker
                workspaceId={workspaceId}
                value={values.linkedUser}
                onChange={(user) => set("linkedUser", user)}
                error={Boolean(errors.linkedUserId)}
                helperText={errors.linkedUserId || "Link them if they have a Sprintory account in this workspace."}
              />
            </Box>
            {submit.error && <Alert severity="error">{submit.error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={submit.submitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={submit.submitting}>
            {adding ? "Add stakeholder" : "Save"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default StakeholderDialog;

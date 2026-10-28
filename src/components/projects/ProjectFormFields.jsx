import { Box, Typography } from "@mui/material";
import FormField from "../forms/FormField";
import TemplateChip from "./TemplateChip";

// a read-only "label  value" line for what can't change
const Fixed = ({ label, children }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    {children}
  </Box>
);

// The name and description fields of a project, plus its fixed key and template.
// `form` comes from useProjectForm; `disabled` shows the values without letting them change.
const ProjectFormFields = ({ project, form, disabled = false, autoFocus = false }) => (
  <>
    <FormField
      id="project-name"
      label="Project name"
      value={form.name}
      onChange={(e) => form.changeName(e.target.value)}
      error={Boolean(form.nameError)}
      helperText={form.nameError}
      disabled={disabled}
      autoFocus={autoFocus}
    />
    <FormField
      id="project-description"
      label="Description"
      placeholder={disabled ? "No description" : "What is this project about?"}
      value={form.description}
      onChange={(e) => form.setDescription(e.target.value)}
      disabled={disabled}
      multiline
      minRows={3}
    />
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 3, rowGap: 1 }}>
        <Fixed label="Key">
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {project.key}
          </Typography>
        </Fixed>
        <Fixed label="Template">
          <TemplateChip template={project.template} />
        </Fixed>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
        The key and the template can't be changed.
      </Typography>
    </Box>
  </>
);

export default ProjectFormFields;

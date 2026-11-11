import { Box, Stack, Typography } from "@mui/material";
import SectionCard from "../../general/SectionCard";
import RoleChip from "../RoleChip";
import MembersSection from "./MembersSection";
import { PROJECT_ROLE_DESCRIPTIONS, PROJECT_ROLES_BY_TEMPLATE } from "../../../constants/projects";

// one sentence on who changes this list, and whether the caller can (`readOnly`: the project or its workspace
// is archived)
const accessText = ({ readOnly, canManage }) => {
  const rule = "Project Managers and workspace admins add and remove people and change their roles.";
  if (readOnly) return `${rule} The project is archived, so people can't be changed now.`;
  return canManage ? rule : `${rule} You can see who's in this project, but you can't change it.`;
};

// what each of this template's roles may do, so "Change roles" makes sense (Developer is MEMBER in Scrum)
const RolesCard = ({ template }) => (
  <SectionCard title="Roles in this project">
    <Box component="dl" sx={{ m: 0 }}>
      {/* a div per role keeps each dt / dd pair together; the line between rows is its top border */}
      {(PROJECT_ROLES_BY_TEMPLATE[template] ?? []).map((role, index) => (
        <Box
          key={role}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "180px minmax(0, 1fr)" },
            alignItems: "center",
            gap: { xs: 0.75, sm: 2 },
            px: { xs: 2, sm: 3 },
            py: 1.5,
            borderTop: index > 0 ? 1 : 0,
            borderColor: "divider",
          }}
        >
          <Box component="dt">
            <RoleChip role={role} template={template} />
          </Box>
          <Typography component="dd" variant="body2" color="text.secondary" sx={{ m: 0 }}>
            {PROJECT_ROLE_DESCRIPTIONS[role]}
          </Typography>
        </Box>
      ))}
    </Box>
  </SectionCard>
);

// Settings → People and access (what used to be the Members tab): who manages it, the members, and the roles.
// The add / remove / roles windows belong to the project page, opened through the callbacks.
const PeopleSection = ({ project, readOnly, version, canManage, canEditRoles, onAddPeople, onAddTeam, onRemove, onEditRoles }) => (
  <Stack spacing={3}>
    <Typography variant="body2" color="text.secondary">
      {accessText({ readOnly, canManage })}
    </Typography>
    <MembersSection
      project={project}
      version={version}
      canManage={canManage}
      canEditRoles={canEditRoles}
      onAddPeople={onAddPeople}
      onAddTeam={onAddTeam}
      onRemove={onRemove}
      onEditRoles={onEditRoles}
    />
    <RolesCard template={project.template} />
  </Stack>
);

export default PeopleSection;

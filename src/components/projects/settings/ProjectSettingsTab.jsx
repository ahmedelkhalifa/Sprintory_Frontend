import { Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import SettingsNav from "./SettingsNav";
import GeneralSection from "./GeneralSection";
import PeopleSection from "./PeopleSection";
import ArchiveSection from "./ArchiveSection";
import BoardColumnsSection from "../../board/BoardColumnsSection";
import JiraImportSection from "../../jiraimport/JiraImportSection";
import { settingsSectionsFor, statusActionsFor } from "./settingsSections";

// The project's Settings tab, Jira-like: a section menu on the left and one section on the right, each on its own
// url (`section` from settings/:section, General without one; pathFor(id) builds them). An unknown section, or one
// this caller doesn't have (Board columns without CONFIGURE_BOARD, nothing to archive), goes back to General.
// `people` carries what People and access needs: { version, canManage, canEditRoles, onAddPeople, onAddTeam,
// onRemove, onEditRoles }. `onAction(type)` opens the archive / restore / delete confirmation, `onSaved` runs after
// the name or description changed.
const ProjectSettingsTab = ({ project, section = "general", pathFor, writable, workspaceArchived, people, onSaved, onAction }) => {
  const sections = settingsSectionsFor(project, workspaceArchived, writable);
  if (!sections.some(({ id }) => id === section)) return <Navigate to={pathFor("general")} replace />;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "220px minmax(0, 1fr)" },
        gap: 3,
        alignItems: "start",
      }}
    >
      <SettingsNav sections={sections} current={section} pathFor={pathFor} />

      <Box sx={{ minWidth: 0 }}>
        {section === "general" && (
          // restarts the form when the saved values change, e.g. after the header's Edit project window
          <GeneralSection
            key={`${project.name}\n${project.description ?? ""}`}
            project={project}
            writable={writable}
            onSaved={onSaved}
          />
        )}
        {section === "people" && <PeopleSection project={project} readOnly={!writable} {...people} />}
        {section === "board" && <BoardColumnsSection project={project} writable={writable} />}
        {section === "jira-import" && <JiraImportSection key={project.id} project={project} />}
        {section === "archive" && (
          <ArchiveSection actions={statusActionsFor(project, workspaceArchived)} onAction={onAction} />
        )}
      </Box>
    </Box>
  );
};

export default ProjectSettingsTab;

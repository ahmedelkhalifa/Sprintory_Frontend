import ProjectChatPanel from "../../components/chat/ProjectChatPanel";
import { useProjectAccess, useWorkspaceAccess } from "../../hooks/useResourceAccess";

// the project's Chat tab
const ProjectChatPage = () => {
  const { project } = useProjectAccess();
  const { workspace } = useWorkspaceAccess();
  return <ProjectChatPanel project={project} workspace={workspace} />;
};

export default ProjectChatPage;

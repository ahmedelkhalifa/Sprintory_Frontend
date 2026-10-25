import ToneChip from "../general/ToneChip";
import { projectRoleLabel } from "../../utils/project";

const TONES = {
  PROJECT_MANAGER: "primary.dark",
  PRODUCT_OWNER: "primary.main",
  SCRUM_MASTER: "primary.main",
};

// A member's project role, e.g. "Project Manager" or "Developer" (MEMBER in a Scrum project)
const RoleChip = ({ role, template }) => (
  <ToneChip label={projectRoleLabel(role, template)} tone={TONES[role] ?? "text.secondary"} />
);

export default RoleChip;

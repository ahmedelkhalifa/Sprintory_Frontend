import ToneChip from "../general/ToneChip";
import { PRODUCT_OWNER, PROJECT_MANAGER, SCRUM_MASTER, projectRoleLabel } from "../../constants/roles";

const TONES = {
  [PROJECT_MANAGER]: "primary.dark",
  [PRODUCT_OWNER]: "primary.main",
  [SCRUM_MASTER]: "primary.main",
};

// A member's project role, e.g. "Project Manager" or "Developer" (MEMBER in a Scrum project)
const RoleChip = ({ role, template }) => (
  <ToneChip label={projectRoleLabel(role, template)} tone={TONES[role] ?? "text.secondary"} />
);

export default RoleChip;

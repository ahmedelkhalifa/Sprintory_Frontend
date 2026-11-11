import ToneChip from "../general/ToneChip";
import { PROJECT_STATUS } from "../../constants/projects";

// "Active" / "Archived" label with a dot (project status is ASSUMED until R30)
const StatusChip = ({ status }) => {
  const archived = status === PROJECT_STATUS.ARCHIVED;
  // archived is a resting state, not a failure: neutral, not red
  return <ToneChip dot label={archived ? "Archived" : "Active"} tone={archived ? "text.secondary" : "success.main"} />;
};

export default StatusChip;

import ToneChip from "../general/ToneChip";
import { PROJECT_STATUS } from "../../constants/projects";

// "Active" / "Archived" label with a dot (project status is ASSUMED until R30)
const StatusChip = ({ status }) => {
  const archived = status === PROJECT_STATUS.ARCHIVED;
  return <ToneChip dot label={archived ? "Archived" : "Active"} tone={archived ? "error.main" : "success.main"} />;
};

export default StatusChip;

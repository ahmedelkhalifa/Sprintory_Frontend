import { Tooltip } from "@mui/material";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import ToneChip from "../general/ToneChip";
import { formatDate } from "../../utils/format";

const MilestoneChip = ({ milestone }) => {
    if (!milestone) return null;
    const dateText = milestone.targetDate ? `Target date: ${formatDate(milestone.targetDate)}` : "";

    return (
        <Tooltip title={dateText}>
      <span style={{ display: "inline-flex" }}>
        <ToneChip
            label={milestone.name}
            tone="primary.main"
            icon={<FlagOutlinedIcon sx={{ fontSize: "14px !important" }} />}
        />
      </span>
        </Tooltip>
    );
};

export default MilestoneChip;
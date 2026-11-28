import { Box, Tooltip } from "@mui/material";
import ToneChip from "../general/ToneChip";
import { formatDate } from "../../utils/format";

const MilestoneChip = ({ milestone }) => {
    if (!milestone) return null;
    const title = milestone.targetDate ? `Target date: ${formatDate(milestone.targetDate)}` : "";

    return (
        <Tooltip title={title}>
            <Box component="span" sx={{ display: "inline-flex" }}>
                <ToneChip label={milestone.name} />
            </Box>
        </Tooltip>
    );
};

export default MilestoneChip;
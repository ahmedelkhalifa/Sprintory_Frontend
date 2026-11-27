import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import TimelapseOutlinedIcon from "@mui/icons-material/TimelapseOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { TASK_STAGES } from "../../constants/tasks";

const ICONS = { TODO: RadioButtonUncheckedIcon, IN_PROGRESS: TimelapseOutlinedIcon, DONE: CheckCircleIcon };

// A status category as an icon in its color (to do: an empty circle, in progress: a half one, done: a check), so a
// status never rests on color alone. `statusName` is the actual column, read out by screen readers and on hover
const StageIcon = ({ category, statusName, size = 16 }) => {
  const Icon = ICONS[category] ?? ICONS.TODO;
  return (
    <Icon
      titleAccess={statusName}
      sx={{ fontSize: size, flexShrink: 0, color: TASK_STAGES[category]?.tone ?? "text.secondary" }}
    />
  );
};

export default StageIcon;

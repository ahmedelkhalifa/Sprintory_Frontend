import ToneChip from "../general/ToneChip";
import { TEMPLATES } from "../../constants/projects";

const TONES = { SCRUM: "primary.main", KANBAN: "success.main" };

// "Scrum" / "Kanban" label for a project's template
const TemplateChip = ({ template }) => {
  if (!template) return null;
  return <ToneChip label={TEMPLATES[template]?.label ?? template} tone={TONES[template]} />;
};

export default TemplateChip;

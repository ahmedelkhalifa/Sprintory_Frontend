import ToneChip from "../general/ToneChip";
import { TEMPLATES } from "../../constants/projects";

// "Scrum" / "Kanban" label for a project's template; neutral, since a template is a kind, not a state
const TemplateChip = ({ template }) => {
  if (!template) return null;
  return <ToneChip label={TEMPLATES[template]?.label ?? template} tone="text.secondary" />;
};

export default TemplateChip;

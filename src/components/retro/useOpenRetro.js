import { useNavigate } from "react-router-dom";
import { openRetro } from "../../api/retrosApi";
import { useSubmit } from "../../hooks/useSubmit";
import { RETRO_ERROR_MESSAGES } from "../../constants/retro";
import { retroPath } from "../../utils/retro";

// Creates an ended sprint's retro and goes to its page. The backend answers the same retro when someone else has
// just created it, so two managers clicking at once both end up in it.
export const useOpenRetro = (workspace, project) => {
  const navigate = useNavigate();
  const submit = useSubmit(RETRO_ERROR_MESSAGES);

  const open = async (sprintId) => {
    const { ok, result } = await submit.run(() => openRetro(sprintId));
    if (ok) navigate(retroPath(workspace, project, result.id));
  };

  return { opening: submit.submitting, error: submit.error, open };
};

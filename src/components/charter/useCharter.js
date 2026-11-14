import { useState } from "react";
import { getCharter, reorderCharterGoals } from "../../api/charterApi";
import { useAsync } from "../../hooks/useAsync";
import { CHARTER_ERROR_MESSAGES } from "../../constants/charter";
import { errorMessage } from "../../utils/apiError";
import { canEditCharter, charterReadOnlyReason, goalIds, moveGoal, sortGoals } from "../../utils/charter";

// The project charter (PMP-117, backend project-charter-docs.md), shown in the project's Overview: goals,
// in / out of scope, the stakeholder register and the goal / scope history. Members only, Viewers included (anyone
// else gets 404, which also keeps the stakeholders' contact details private), so `enabled` is false for them.
// The backend's `canEdit` decides the edit controls: the Project Manager, and the Product Owner in Scrum, while the
// project and workspace are active. `writable` (from the project page) also hides them when the frontend already
// knows the project is archived. The charter lives in this hook's state only, never in a shared store.
export const useCharter = (project, { writable, enabled = true }) => {
  const state = useAsync((signal) => getCharter(project.id, signal), [project.id], {
    enabled,
    fallback: "Couldn't load the charter. Please try again.",
    messages: { ...CHARTER_ERROR_MESSAGES, RESOURCE_NOT_FOUND: "The charter is only available to project members." },
  });
  // bumped after a goal or scope change, so the history loads its newest page again
  const [historyVersion, setHistoryVersion] = useState(0);
  // an optimistic goal order, valid only for the charter it was made from: a reload replaces it
  const [order, setOrder] = useState(null); // { base, goals, saving }
  const [notice, setNotice] = useState(null); // { text, severity }

  const charter = state.data;
  const goals = !charter ? [] : order?.base === charter ? order.goals : sortGoals(charter.goals);

  const showNotice = (text, severity = "success") => setNotice({ text, severity });

  // after any change: the charter again; goal and scope changes also add history entries
  const afterChange = () => {
    state.reload();
    setHistoryVersion((v) => v + 1);
  };

  const reorder = async (from, to) => {
    const moved = moveGoal(goals, from, to);
    if (moved === goals) return;
    setOrder({ base: charter, goals: moved, saving: true });
    try {
      const saved = await reorderCharterGoals(project.id, goalIds(moved));
      setOrder({ base: charter, goals: sortGoals(saved), saving: false });
      afterChange();
    } catch (err) {
      // back to the saved order; someone may have added or removed a goal meanwhile, so load it again
      setOrder(null);
      showNotice(errorMessage(err, "Couldn't save the new order. Please try again.", CHARTER_ERROR_MESSAGES), "error");
      state.reload();
    }
  };

  return {
    state,
    charter,
    goals,
    editable: Boolean(charter) && canEditCharter(charter) && writable,
    readOnlyReason: charter ? charterReadOnlyReason(charter, project) : null,
    reordering: Boolean(charter && order?.base === charter && order.saving),
    reorder,
    afterChange,
    historyVersion,
    notice,
    showNotice,
    clearNotice: () => setNotice(null),
  };
};

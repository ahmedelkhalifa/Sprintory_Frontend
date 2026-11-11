import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { openNotification } from "../api/notificationsApi";
import { useWorkspaces } from "../context/WorkspaceContext";
import { errorCode, errorMessage } from "../utils/apiError";
import { notificationTargetPath } from "../utils/notification";

/**
 * Opening a notification, shared by the bell and the home page's Recent updates: "open" marks it read on the backend
 * and says where to go (the stream then sends the new unread count).
 * open(notification, { onRead, onNavigate }): onRead(id) once it's read, onNavigate() just before leaving.
 * opening is the id being opened; itemErrors maps an id to its text, e.g. for a deleted task.
 */
export const useOpenNotification = () => {
  const navigate = useNavigate();
  const { workspaces } = useWorkspaces();
  const [opening, setOpening] = useState(null);
  const [itemErrors, setItemErrors] = useState({});

  const open = async (notification, { onRead, onNavigate } = {}) => {
    setOpening(notification.id);
    setItemErrors((prev) => ({ ...prev, [notification.id]: "" }));
    try {
      const target = await openNotification(notification.id);
      onRead?.(notification.id);
      const path = notificationTargetPath(target, workspaces, notification.type);
      // NONE (an invitation or a security notice): nothing to open, it just turns read
      if (path) {
        onNavigate?.();
        navigate(path);
      }
    } catch (err) {
      // the task or project is gone or no longer visible; the backend still marked it read
      const gone = errorCode(err) === "RESOURCE_NOT_FOUND";
      if (gone) onRead?.(notification.id);
      const text = gone ? "This item is no longer available." : errorMessage(err);
      setItemErrors((prev) => ({ ...prev, [notification.id]: text }));
    } finally {
      setOpening(null);
    }
  };

  return { opening, itemErrors, open, clearErrors: () => setItemErrors({}) };
};

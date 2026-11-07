import { createContext, useContext } from "react";

export const UndoDeleteContext = createContext(null);

// { deleted(task, projectId) }: call it right after a task or subtask was deleted to offer Undo
export const useUndoDelete = () => useContext(UndoDeleteContext);

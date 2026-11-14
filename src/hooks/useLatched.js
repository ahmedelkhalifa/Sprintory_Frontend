import { useEffect, useState } from "react";
import { DIALOG_EXIT_MS } from "../theme/motion";

// Keeps the last non-null value for `ms` after it turns null, so a window that is only rendered while open
// (`{dialog?.type === "edit" && <EditDialog open={...} />}`) stays mounted long enough to play its close.
// Render from the returned value; pass `open` from the live one.
export const useLatched = (value, ms = DIALOG_EXIT_MS + 40) => {
  const [kept, setKept] = useState(value);
  const [seen, setSeen] = useState(value);
  // a new value: remember it (React's "adjust state while rendering" pattern, no extra commit)
  if (value !== seen) {
    setSeen(value);
    if (value != null) setKept(value);
  }
  useEffect(() => {
    if (value != null) return undefined;
    const timer = setTimeout(() => setKept(null), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return value ?? kept;
};

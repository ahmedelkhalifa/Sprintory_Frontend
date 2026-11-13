import { useRef } from "react";
import Fade from "@mui/material/Fade";
import { EASE_OUT, SNACKBAR_EXIT_MS, SPRING, prefersReducedMotion } from "./motion";

// A snackbar's transition (the theme's MuiSnackbar slot): it fades (MUI's Fade keeps the timing) and rises 16px
// from the edge it sits on, on the spring; it leaves faster, dropping 8px back toward that edge. `direction` is
// Snackbar's: "up" for one at the bottom, "down" for one at the top. Reduced motion: the fade alone.
const RiseIn = ({ direction = "up", onEnter, onExit, ref, ...props }) => {
  const motion = useRef(null);
  const edge = direction === "down" ? -1 : 1; // which way is back toward the edge

  const enter = (node, isAppearing) => {
    onEnter?.(node, isAppearing);
    if (prefersReducedMotion()) return;
    motion.current?.cancel();
    motion.current = node.animate([{ transform: `translateY(${16 * edge}px)` }, { transform: "none" }], {
      duration: SPRING.duration,
      easing: SPRING.easing,
    });
  };

  const exit = (node) => {
    onExit?.(node);
    if (prefersReducedMotion()) return;
    // from where it is on screen (it may still be rising)
    const current = getComputedStyle(node).transform;
    motion.current?.cancel();
    motion.current = node.animate(
      [{ transform: current === "none" ? "none" : current }, { transform: `translateY(${8 * edge}px)` }],
      { duration: SNACKBAR_EXIT_MS, easing: EASE_OUT, fill: "forwards" },
    );
  };

  return <Fade ref={ref} {...props} onEnter={enter} onExit={exit} />;
};

export default RiseIn;

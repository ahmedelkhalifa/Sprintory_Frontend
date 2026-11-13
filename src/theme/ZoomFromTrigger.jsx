import { useRef } from "react";
import Fade from "@mui/material/Fade";
import { DIALOG_EXIT_MS, EASE_IN_OUT, EASE_OUT, SPRING, prefersReducedMotion, recentTrigger } from "./motion";

// where the paper has to be, as a transform, to sit small on top of the button
const towards = (rect, box) => {
  const dx = rect.left + rect.width / 2 - (box.left + box.width / 2);
  const dy = rect.top + rect.height / 2 - (box.top + box.height / 2);
  const scale = Math.min(0.5, Math.max(0.25, rect.width / box.width));
  return `translate(${dx}px, ${dy}px) scale(${scale})`;
};

const paperOf = (node) => node.querySelector(".MuiDialog-paper");

// A dialog's transition (the theme's MuiDialog slot): the container fades (MUI's Fade, which also keeps the
// timing and focus handling), the paper grows out of the button that was just clicked, like iOS / macOS, and
// goes back into it on close. Opened from the keyboard or on its own, it only settles in from 96% (and out to
// it). Reduced motion: the fade alone.
const ZoomFromTrigger = ({ onEnter, onExit, ref, ...props }) => {
  const trigger = useRef(null); // the button it came out of, so it can go back in
  const motion = useRef(null);

  const enter = (node, isAppearing) => {
    onEnter?.(node, isAppearing);
    const paper = paperOf(node);
    trigger.current = recentTrigger()?.element ?? null;
    if (!paper || prefersReducedMotion()) return;
    const box = paper.getBoundingClientRect();
    const from = trigger.current && box.width > 0 ? towards(trigger.current.getBoundingClientRect(), box) : "scale(0.96)";
    const timing = trigger.current ? { duration: SPRING.duration, easing: SPRING.easing } : { duration: 200, easing: EASE_OUT };
    motion.current = paper.animate([{ transform: from }, { transform: "none" }], timing);
  };

  const exit = (node) => {
    onExit?.(node);
    const paper = paperOf(node);
    if (!paper || prefersReducedMotion()) return;
    // start from where it is on screen (it may still be growing), not from where it was going
    const current = getComputedStyle(paper).transform;
    motion.current?.cancel();
    const box = paper.getBoundingClientRect();
    // the button can be gone by now (a menu item, a row that was deleted): then just settle out in place
    const button = trigger.current?.isConnected ? trigger.current : null;
    const to = button && box.width > 0 ? towards(button.getBoundingClientRect(), box) : "scale(0.96)";
    motion.current = paper.animate([{ transform: current === "none" ? "none" : current }, { transform: to }], {
      duration: DIALOG_EXIT_MS,
      easing: button ? EASE_IN_OUT : EASE_OUT,
      fill: "forwards",
    });
  };

  return <Fade ref={ref} {...props} onEnter={enter} onExit={exit} />;
};

export default ZoomFromTrigger;

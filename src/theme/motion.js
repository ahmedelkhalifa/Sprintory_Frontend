import { keyframes } from "@mui/material/styles";
import { SHELL_EASE } from "./layout";

// Shared motion values (Apple-style springs, translated to CSS easings) and the click tracker that lets a
// dialog grow out of the button that opened it. Only transform and opacity are ever animated.

// a spring's curve as CSS linear() points: `response` is how fast it gets there (s), `damping` 1 = no bounce.
// Computed once; browsers without linear() get the iOS drawer curve instead.
const springCurve = ({ response, damping, duration }) => {
  const omega = (2 * Math.PI) / response;
  const position = (t) => {
    if (damping >= 1) return 1 - (1 + omega * t) * Math.exp(-omega * t);
    const root = Math.sqrt(1 - damping * damping);
    const decay = Math.exp(-damping * omega * t);
    return 1 - decay * (Math.cos(omega * root * t) + (damping / root) * Math.sin(omega * root * t));
  };
  const steps = 40;
  const points = Array.from({ length: steps + 1 }, (_, i) => (i === steps ? 1 : position((i / steps) * duration)));
  return `linear(${points.map((p) => Number(p.toFixed(4))).join(", ")})`;
};

const supportsLinear = typeof CSS !== "undefined" && CSS.supports?.("transition-timing-function", "linear(0, 1)");
const FALLBACK = "cubic-bezier(0.32, 0.72, 0, 1)";

// no bounce: dialogs, drawers, anything the interface moves on its own (duration is how long it plays, ms)
export const SPRING = { easing: supportsLinear ? springCurve({ response: 0.35, damping: 1, duration: 0.4 }) : FALLBACK, duration: 400 };
// a little bounce, only where the user threw something (a drag drop)
export const SPRING_BOUNCY = {
  easing: supportsLinear ? springCurve({ response: 0.3, damping: 0.85, duration: 0.4 }) : FALLBACK,
  duration: 400,
};
export const EASE_OUT = SHELL_EASE;
// for something going back where it came from: eases in and out, so it neither lingers nor slams
export const EASE_IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";

// how long a dialog takes to close (its fade and its way back into the button)
export const DIALOG_EXIT_MS = 220;
// how long a drawer takes to slide back out (useLatched's default keeps it mounted long enough)
export const SHEET_EXIT_MS = DIALOG_EXIT_MS;
// how long a snackbar takes to leave (it arrives on SPRING)
export const SNACKBAR_EXIT_MS = 150;

// How hover / selection colors change, the same everywhere: `hoverTransition("border-color", "background-color")`
// for an sx `transition` (backgrounds, borders, text, a revealed control's opacity).
export const HOVER_MS = 150;
export const hoverTransition = (...properties) => properties.map((p) => `${p} ${HOVER_MS}ms ease`).join(", ");

// Press feedback for anything clickable, Apple-style, as sx / style-override styles: the press shows at once
// (80ms) and the release springs back with a hint of give. `colors` is the control's own color transition, kept
// next to the transform (a `transition` in sx would otherwise drop the spring). Reduced motion: no scale.
// The scale: 0.97 buttons, 0.92 icon buttons, 0.96 small controls, 0.98 rows and cards.
export const pressable = (scale, colors = hoverTransition("background-color")) => ({
  transition: `${colors}, transform ${SPRING_BOUNCY.duration}ms ${SPRING_BOUNCY.easing}`,
  "&:active": { transform: `scale(${scale})`, transition: `${colors}, transform 80ms ${EASE_OUT}` },
  "@media (prefers-reduced-motion: reduce)": { "&:active": { transform: "none" } },
});

// The same press for a card whose clickable part is inside it (`pressed`, a selector of a direct child), so the
// whole card presses with it, but not when one of its other buttons (a "..." menu) is pressed.
export const pressableCard = (pressed, scale = 0.98, colors = hoverTransition("border-color")) => ({
  transition: `${colors}, transform ${SPRING_BOUNCY.duration}ms ${SPRING_BOUNCY.easing}`,
  [`&:has(> ${pressed}:active)`]: { transform: `scale(${scale})`, transition: `${colors}, transform 80ms ${EASE_OUT}` },
  "@media (prefers-reduced-motion: reduce)": { [`&:has(> ${pressed}:active)`]: { transform: "none" } },
});

// New content arriving when it mounts (a project tab): it slides in `dx` px from the side it came from and fades
// in, on the same spring as the tab underline, so it reads as one motion with it. The distance stays inside the
// page's padding, so no scrollbar flashes. Reduced motion: a short fade only.
const fadeInKeyframes = keyframes`
  from { opacity: 0; }
`;
const slideInKeyframes = keyframes`
  from { opacity: 0; transform: translateX(var(--slide-from)); }
`;
export const slideIn = (dx) => ({
  "--slide-from": `${dx}px`,
  "@media (prefers-reduced-motion: no-preference)": {
    animation: `${slideInKeyframes} ${SPRING.duration}ms ${SPRING.easing}`,
  },
  "@media (prefers-reduced-motion: reduce)": { animation: `${fadeInKeyframes} 150ms ${EASE_OUT}` },
});

// Loaded content arriving in blocks, one after another: each block fades in and rises 6px, 40ms after the one
// before. Only for whole sections (a column, a sprint box, a card), never for every row. It plays when the block
// mounts, so a reload that keeps the content on screen doesn't replay it. `backwards` holds the block hidden
// during its delay and leaves nothing behind once it's done. Reduced motion: a plain fade, all at once.
const riseInKeyframes = keyframes`
  from { opacity: 0; transform: translateY(6px); }
`;
const STAGGER_STEP = 40;
const REVEAL_MS = 250;
const REDUCED_FADE = { animation: `${fadeInKeyframes} 150ms ${EASE_OUT}` };
const riseIn = (delay) => `${riseInKeyframes} ${REVEAL_MS}ms ${EASE_OUT} ${delay}ms backwards`;

// one block, `order` places it in the sequence (0 = first)
export const reveal = (order = 0) => ({
  "@media (prefers-reduced-motion: no-preference)": { animation: riseIn(order * STAGGER_STEP) },
  "@media (prefers-reduced-motion: reduce)": REDUCED_FADE,
});

// a container whose direct children are the blocks, starting at `start` in the sequence; after `max` blocks the
// rest come in together, so a long list doesn't trail behind
export const revealChildren = (start = 0, max = 6) => {
  const delays = {};
  for (let n = 2; n <= max; n += 1) {
    delays[`& > :nth-child(${n})`] = { animationDelay: `${(start + n - 1) * STAGGER_STEP}ms` };
  }
  delays[`& > :nth-child(n + ${max + 1})`] = { animationDelay: `${(start + max) * STAGGER_STEP}ms` };
  return {
    "@media (prefers-reduced-motion: no-preference)": { "& > *": { animation: riseIn(start * STAGGER_STEP) }, ...delays },
    "@media (prefers-reduced-motion: reduce)": { "& > *": REDUCED_FADE },
  };
};

// The copy that follows the pointer while dragging (a board card, a backlog row): picked up, it grows a little
// and its shadow deepens, like lifting a card off the table. The shadow is a layer that fades in (opacity, not an
// animated box-shadow). `animate` is false for a keyboard drag, which just shows it lifted. Reduced motion: the
// shadow only, no scale.
const liftKeyframes = keyframes`
  from { transform: none; }
`;
const LIFT_MS = 150;
export const lifted = (scale, animate = true) => ({
  position: "relative",
  transform: `scale(${scale})`,
  cursor: "grabbing",
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    boxShadow: 4,
    pointerEvents: "none",
  },
  ...(animate && {
    "@media (prefers-reduced-motion: no-preference)": {
      animation: `${liftKeyframes} ${LIFT_MS}ms ${EASE_OUT}`,
      "&::after": { animation: `${fadeInKeyframes} ${LIFT_MS}ms ${EASE_OUT}` },
    },
  }),
  "@media (prefers-reduced-motion: reduce)": { transform: "none" },
});

// a small thing settling in where a placeholder was (an empty message): a short fade, also with reduced motion
export const FADE_IN_SX = REDUCED_FADE;

// a loading placeholder (skeleton) only shows if loading takes more than 200ms, so a quick load goes straight
// from nothing to the content instead of flashing a skeleton first
export const LOADING_DELAY_SX = { animation: `${fadeInKeyframes} 150ms ${EASE_OUT} 200ms backwards` };

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// The last thing clicked with a mouse or a finger. A keyboard "click" (Enter / Space, detail 0) clears it, so a
// dialog opened from the keyboard doesn't fly in from an old spot; so does age (a dialog that opens on its own).
const TRIGGER_SELECTOR = 'button, a, [role="button"], [role="menuitem"], [role="tab"], [role="option"]';
const TRIGGER_MAX_AGE = 600;
let lastClick = null;

if (typeof document !== "undefined") {
  document.addEventListener(
    "click",
    (event) => {
      const trigger = event.detail > 0 ? event.target.closest?.(TRIGGER_SELECTOR) : null;
      lastClick = trigger ? { element: trigger, rect: trigger.getBoundingClientRect(), at: performance.now() } : null;
    },
    true,
  );
}

// the button that was just clicked ({ element, rect }), or null
export const recentTrigger = () =>
  lastClick && performance.now() - lastClick.at < TRIGGER_MAX_AGE ? lastClick : null;

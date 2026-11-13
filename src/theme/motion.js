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

// Press feedback for anything clickable, Apple-style, as sx / style-override styles: the press shows at once
// (80ms) and the release springs back with a hint of give. `colors` is the control's own color transition, kept
// next to the transform (a `transition` in sx would otherwise drop the spring). Reduced motion: no scale.
export const pressable = (scale, colors = "background-color 150ms ease") => ({
  transition: `${colors}, transform ${SPRING_BOUNCY.duration}ms ${SPRING_BOUNCY.easing}`,
  "&:active": { transform: `scale(${scale})`, transition: `${colors}, transform 80ms ${EASE_OUT}` },
  "@media (prefers-reduced-motion: reduce)": { "&:active": { transform: "none" } },
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

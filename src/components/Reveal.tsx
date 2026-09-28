"use client";

// Entry of the sections on scroll, with an exit for whoever asked for less motion.
//
// The rule this component carries came from the design skill: motion exists to show a cause
// and effect relation, not to decorate, and animating a layout property (width, height, top) makes the browser redo
// the whole page every frame. That is why the animation is of opacity and offset, with an exponential
// exit curve, with no bounce.
//
// No React state on purpose. The first version used a flag with setState inside the effect, and the
// lint of this house rejected it with react-hooks/set-state-in-effect, which is the same rule that has already rejected code here. The
// class on the element itself solves it: the CSS runs the animation, and the component only decides when it starts.
//
// Whoever asked for less motion in the system gets the section visible with no animation, and the CSS guarantees that through the media
// query, not through JavaScript logic.
import { useEffect, useRef } from "react";

type Props = { children: React.ReactNode; className?: string; id?: string };

export function Reveal({ children, className, id }: Props) {
  const target = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      el.classList.add("entered");
      return;
    }
    const observador = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add("entered");
          observador.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <div ref={target} id={id} className={`vai-entrar ${className ?? ""}`.trim()}>
      {children}
    </div>
  );
}

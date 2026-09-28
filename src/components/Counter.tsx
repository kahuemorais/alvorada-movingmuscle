"use client";

import { useEffect, useRef } from "react";
import { num } from "@/lib/format";

// The three numbers of the opening come in counting, and not appearing ready: a number that moves reads as data, and
// not as a decorative badge. The FINAL text already comes rendered from the server, so without JavaScript, or for whoever
// asked for less motion in the system, the page shows the right value, never a zero.
//
// The FLOOR of the count: it started at zero, and at the start of the animation the score
// of 4,8 appeared as 0,3, measured frame by frame. A number the server delivers right and that regresses on screen reads as
// wrong data. Now the count starts at 90% of the value and rises to it, always in the same direction: 4,3 to 4,8 in the
// score, 1.656 to 1.840 in the installations. The floor is a presentation rail, like the limits of the simulator, and it lives
// named here, with the reason next to it.
const PISO = 0.9;
const DURATION_MS = 700;
//
// No React state on purpose: the component writes to the textContent of the element itself. State here
// would swap a number every frame and would still fall into the lint rule that forbids `setState` inside an effect.
export function Counter({ value, casas = 0 }: { value: number; casas?: number }) {
  const target = useRef<HTMLSpanElement>(null);
  const formatar = (v: number) => (casas > 0 ? v.toFixed(casas) : num(Math.round(v)));
  const text = formatar(value);

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    let quadro = 0;
    let start = 0;
    const passo = (t: number) => {
      if (!start) start = t;
      const parte = Math.min(1, (t - start) / DURATION_MS);
      el.textContent = formatar(value * (PISO + (1 - PISO) * parte));
      if (parte < 1) quadro = requestAnimationFrame(passo);
      else el.textContent = formatar(value);
    };
    const observador = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observador.disconnect();
        quadro = requestAnimationFrame(passo);
      }
    });
    observador.observe(el);
    return () => {
      observador.disconnect();
      cancelAnimationFrame(quadro);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, casas]);

  return <span ref={target}>{text}</span>;
}

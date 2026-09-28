"use client";

import { useEffect, useRef } from "react";
import { num } from "@/lib/format";

// Os três números da abertura entram contando, e não aparecendo prontos: número que se move lê como dado, e
// não como selo decorativo. O texto FINAL já vem renderizado do servidor, então sem JavaScript — ou para quem
// pediu menos movimento no sistema — a página mostra o valor certo, nunca um zero.
//
// O PISO da contagem: ela começava em zero, e no começo da animação a nota
// de 4,8 aparecia como 0,3, medido quadro a quadro. Número que o servidor entrega certo e regride na tela lê como
// dado errado. Agora a contagem começa em 90% do valor e sobe até ele, sempre na mesma direção: 4,3 até 4,8 na
// nota, 1.656 até 1.840 nas instalações. O piso é trilho de apresentação, como os limites do simulador, e vive
// aqui nomeado, com o motivo ao lado.
const PISO = 0.9;
const DURACAO_MS = 700;
//
// Sem estado do React de propósito: o componente escreve no textContent do próprio elemento. Estado aqui
// trocaria um número por quadro e ainda cairia na regra de lint que proíbe `setState` dentro de efeito.
export function Contador({ valor, casas = 0 }: { valor: number; casas?: number }) {
  const alvo = useRef<HTMLSpanElement>(null);
  const formatar = (v: number) => (casas > 0 ? v.toFixed(casas) : num(Math.round(v)));
  const texto = formatar(valor);

  useEffect(() => {
    const el = alvo.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    let quadro = 0;
    let inicio = 0;
    const passo = (t: number) => {
      if (!inicio) inicio = t;
      const parte = Math.min(1, (t - inicio) / DURACAO_MS);
      el.textContent = formatar(valor * (PISO + (1 - PISO) * parte));
      if (parte < 1) quadro = requestAnimationFrame(passo);
      else el.textContent = formatar(valor);
    };
    const observador = new IntersectionObserver((entradas) => {
      if (entradas.some((e) => e.isIntersecting)) {
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
  }, [valor, casas]);

  return <span ref={alvo}>{texto}</span>;
}

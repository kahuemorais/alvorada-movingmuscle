"use client";

// Entrada das seções na rolagem, com saída para quem pediu menos movimento.
//
// A regra que este componente carrega veio da skill de desenho: movimento existe para mostrar relação de causa
// e efeito, não para decorar, e animar propriedade de layout (largura, altura, topo) faz o navegador recalcular
// a página inteira a cada quadro. Por isso a animação é de opacidade e deslocamento, com curva de saída
// exponencial, sem quique.
//
// Sem estado do React de propósito. A primeira versão usava um sinalizador com setState dentro do efeito, e o
// lint da casa reprovou com react-hooks/set-state-in-effect, que é a mesma regra que já reprovou código aqui. A
// classe no próprio elemento resolve: o CSS faz a animação, e o componente só decide quando ela começa.
//
// Quem pediu menos movimento no sistema recebe a seção visível sem animação, e o CSS garante isso pelo media
// query, não por lógica de JavaScript.
import { useEffect, useRef } from "react";

type Props = { children: React.ReactNode; className?: string; id?: string };

export function Aparecer({ children, className, id }: Props) {
  const alvo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = alvo.current;
    if (!el) return;
    const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (semMovimento || !("IntersectionObserver" in window)) {
      el.classList.add("entrou");
      return;
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          el.classList.add("entrou");
          observador.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <div ref={alvo} id={id} className={`vai-entrar ${className ?? ""}`.trim()}>
      {children}
    </div>
  );
}

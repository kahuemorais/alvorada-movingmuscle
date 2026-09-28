import { describe, expect, it } from "vitest";
import { listarTextos, minutosDeLeitura } from "./blog";

// O tempo de leitura é CALCULADO do corpo, e o teste existe para provar isso: um número escrito à mão passaria
// por qualquer verificação de faixa (todo texto tem entre um e trinta minutos), e só a comparação entre textos
// diferentes denuncia que ele não vem do corpo. Foi por isso que a asserção de variedade entrou junto com a de
// faixa: a primeira não distingue constante de conta, a segunda sim.
describe("tempo de leitura", () => {
  const textos = listarTextos();

  it("dá um número inteiro de minutos para todo texto publicado", () => {
    expect(textos.length).toBeGreaterThan(0);
    for (const texto of textos) {
      const minutos = minutosDeLeitura(texto);
      expect(Number.isInteger(minutos), `${texto.slug} devolveu ${minutos}`).toBe(true);
      expect(minutos, `${texto.slug} devolveu ${minutos}`).toBeGreaterThanOrEqual(1);
      expect(minutos, `${texto.slug} devolveu ${minutos}`).toBeLessThanOrEqual(30);
    }
  });

  it("cresce com o corpo, e não é o mesmo número em todo texto", () => {
    const minutos = textos.map((texto) => minutosDeLeitura(texto));
    // A variedade é a prova de que a conta olha o corpo: constante não varia.
    expect(new Set(minutos).size).toBeGreaterThan(1);
  });
});

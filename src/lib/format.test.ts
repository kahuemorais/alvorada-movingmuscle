import { describe, expect, it } from "vitest";
import { anos, nota, num, porcento, porcentoCheio, usd } from "./format";

describe("formatacao", () => {
  it("formata moeda dos Estados Unidos", () => {
    expect(usd(14726.25)).toBe("$14,726.25");
  });
  it("formata o retorno em anos com uma casa", () => {
    expect(anos(6.9)).toBe("6.9 years");
  });
  it("separa milhar", () => {
    expect(num(1840)).toBe("1,840");
  });
  it("formata cobertura em porcento", () => {
    expect(porcento(80)).toBe("80%");
  });

  // Uma cidade com tarifa zero faz a conta virar infinito e a tela mostra
  // "∞ $∞ $NaN NaN years". O esquema da cidade já barra esse dado na entrada; esta guarda é a segunda
  // camada, para o número quebrado falhar o build em vez de aparecer para o visitante.
  it("recusa número não finito, em vez de imprimir NaN ou infinito", () => {
    expect(() => usd(Number.NaN)).toThrow(/não finito/);
    expect(() => num(Number.POSITIVE_INFINITY)).toThrow(/não finito/);
    expect(() => anos(Number.NaN)).toThrow(/não finito/);
    expect(() => porcento(Number.NEGATIVE_INFINITY)).toThrow(/não finito/);
  });

  // A alíquota do incentivo federal vem do arquivo da cidade, e o rótulo precisa dela em porcento. Estava
  // escrita à mão no componente e na descrição de metadados: se o dado mudar, o rótulo mente.
  // A nota da equipe vem do dado como 5 ou como 4.9. Impressa crua, a nota 5 aparece como "5", e a pessoa
  // lê duas escalas diferentes na mesma linha (5 e 4.9). Uma casa decimal sempre resolve.
  it("formata a nota da equipe com uma casa decimal", () => {
    expect(nota(5)).toBe("5.0");
    expect(nota(4.9)).toBe("4.9");
    expect(nota(4.95)).toBe("5.0");
  });

  it("recusa nota não finita", () => {
    expect(() => nota(Number.NaN)).toThrow(/não finito/);
  });

  it("formata a fração da alíquota como porcento inteiro", () => {
    expect(porcentoCheio(0.3)).toBe("30%");
    expect(porcentoCheio(0.25)).toBe("25%");
    expect(porcentoCheio(0.075)).toBe("8%");
    expect(porcentoCheio(1)).toBe("100%");
  });

  it("recusa fração não finita, como os outros formatadores", () => {
    expect(() => porcentoCheio(Number.NaN)).toThrow(/não finito/);
  });

  it("diz quem recebeu o valor quebrado, para o build apontar o lugar", () => {
    expect(() => usd(Number.NaN)).toThrow(/usd/);
    expect(() => anos(Number.NaN)).toThrow(/anos/);
  });
});

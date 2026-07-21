import { describe, expect, it } from "vitest";
import { aplicarFiltros } from "./filtro.js";

interface ItemTeste {
  nome: string;
  valor: number;
  aninhado: { total: number };
}

const ITENS: ItemTeste[] = [
  { nome: "Produto 100kg", valor: 10, aninhado: { total: 100 } },
  { nome: "Produto 500g", valor: 25, aninhado: { total: 50 } },
  { nome: "Outro item", valor: 5, aninhado: { total: 200 } },
];

describe("aplicarFiltros", () => {
  it("sem critérios, devolve a lista intacta", () => {
    expect(aplicarFiltros(ITENS)).toEqual(ITENS);
  });

  it("filtra por 'contem', ignorando maiúsculas e acentos", () => {
    const resultado = aplicarFiltros(ITENS, [{ campo: "nome", operador: "contem", valor: "PRODUTO" }]);
    expect(resultado).toHaveLength(2);
  });

  it("filtra por 'igual'", () => {
    const resultado = aplicarFiltros(ITENS, [{ campo: "valor", operador: "igual", valor: 25 }]);
    expect(resultado).toEqual([ITENS[1]]);
  });

  it("filtra por 'diferente'", () => {
    const resultado = aplicarFiltros(ITENS, [{ campo: "valor", operador: "diferente", valor: 25 }]);
    expect(resultado).toHaveLength(2);
  });

  it("filtra por 'maior_que' e 'menor_que'", () => {
    expect(aplicarFiltros(ITENS, [{ campo: "valor", operador: "maior_que", valor: 10 }])).toHaveLength(1);
    expect(aplicarFiltros(ITENS, [{ campo: "valor", operador: "menor_que", valor: 10 }])).toHaveLength(1);
  });

  it("filtra por 'entre'", () => {
    const resultado = aplicarFiltros(ITENS, [{ campo: "valor", operador: "entre", valor: [5, 10] }]);
    expect(resultado).toHaveLength(2);
  });

  it("acessa campo aninhado por dot-path", () => {
    const resultado = aplicarFiltros(ITENS, [{ campo: "aninhado.total", operador: "maior_que", valor: 100 }]);
    expect(resultado).toEqual([ITENS[2]]);
  });

  it("combina múltiplos critérios com AND", () => {
    const resultado = aplicarFiltros(ITENS, [
      { campo: "nome", operador: "contem", valor: "produto" },
      { campo: "valor", operador: "maior_que", valor: 15 },
    ]);
    expect(resultado).toEqual([ITENS[1]]);
  });

  it("campo inexistente não quebra, só não bate no critério", () => {
    const resultado = aplicarFiltros(ITENS, [{ campo: "nao.existe", operador: "igual", valor: "x" }]);
    expect(resultado).toHaveLength(0);
  });
});

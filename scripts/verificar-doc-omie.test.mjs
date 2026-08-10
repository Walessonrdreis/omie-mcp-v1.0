import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { verificarDocOmie } from "./verificar-doc-omie.mjs";

let raiz;

beforeEach(() => {
  raiz = fs.mkdtempSync(path.join(os.tmpdir(), "doc-omie-"));
});

afterEach(() => {
  fs.rmSync(raiz, { recursive: true, force: true });
});

function escrever(caminhoRelativo, conteudo) {
  const destino = path.join(raiz, caminhoRelativo);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, conteudo, "utf8");
}

describe("limite de tamanho", () => {
  it("acusa arquivo acima de 200 linhas", () => {
    escrever("grande.md", "linha\n".repeat(201));

    const problemas = verificarDocOmie(raiz);

    expect(problemas).toHaveLength(1);
    expect(problemas[0].tipo).toBe("tamanho");
    expect(problemas[0].arquivo).toBe("grande.md");
    expect(problemas[0].linha).toBe(0);
  });

  it("aceita arquivo exatamente no limite", () => {
    escrever("no-limite.md", "linha\n".repeat(200));

    expect(verificarDocOmie(raiz)).toEqual([]);
  });
});

describe("links relativos", () => {
  it("acusa link que não resolve", () => {
    escrever("indice.md", "Veja [produtos](produtos/README.md).\n");

    const problemas = verificarDocOmie(raiz);

    expect(problemas).toHaveLength(1);
    expect(problemas[0].tipo).toBe("link");
    expect(problemas[0].linha).toBe(1);
    expect(problemas[0].mensagem).toContain("produtos/README.md");
  });

  it("aceita link que resolve", () => {
    escrever("indice.md", "Veja [produtos](produtos/README.md).\n");
    escrever("produtos/README.md", "# Produtos\n");

    expect(verificarDocOmie(raiz)).toEqual([]);
  });

  it("resolve link relativo a partir do diretório do arquivo", () => {
    escrever("produtos/README.md", "Volta pro [índice](../README.md).\n");
    escrever("README.md", "# Índice\n");

    expect(verificarDocOmie(raiz)).toEqual([]);
  });

  it("ignora link externo e âncora pura", () => {
    escrever("a.md", "[site](https://app.omie.com.br) e [topo](#secao)\n");

    expect(verificarDocOmie(raiz)).toEqual([]);
  });

  it("ignora a âncora ao resolver um link com fragmento", () => {
    escrever("a.md", "[campo](produtos/campos.md#ncodproduto)\n");
    escrever("produtos/campos.md", "# Campos\n");

    expect(verificarDocOmie(raiz)).toEqual([]);
  });
});

describe("células vazias", () => {
  it("acusa célula vazia em linha de tabela", () => {
    escrever(
      "t.md",
      "| Campo | Tipo |\n|---|---|\n| `codigo_produto` |  |\n"
    );

    const problemas = verificarDocOmie(raiz);

    expect(problemas).toHaveLength(1);
    expect(problemas[0].tipo).toBe("celula-vazia");
    expect(problemas[0].linha).toBe(3);
  });

  it("aceita travessão como preenchimento", () => {
    escrever(
      "t.md",
      "| Campo | Tipo |\n|---|---|\n| `codigo_produto` | — |\n"
    );

    expect(verificarDocOmie(raiz)).toEqual([]);
  });

  it("não confunde a linha separadora com célula vazia", () => {
    escrever("t.md", "| A | B |\n| --- | :---: |\n| 1 | 2 |\n");

    expect(verificarDocOmie(raiz)).toEqual([]);
  });

  it("ignora pipe dentro de bloco de código", () => {
    escrever("t.md", "```\n| isto |  | nao e tabela |\n```\n");

    expect(verificarDocOmie(raiz)).toEqual([]);
  });
});

it("devolve lista vazia quando o diretório não existe", () => {
  expect(verificarDocOmie(path.join(raiz, "inexistente"))).toEqual([]);
});

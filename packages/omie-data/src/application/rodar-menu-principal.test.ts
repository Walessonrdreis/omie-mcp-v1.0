import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FakeOmieHttpClient } from "../infrastructure/fake-omie-http-client.js";
import { IOmieHttpClient } from "../domain/omie-http-client.js";
import { IPromptsMenu, rodarMenuPrincipal } from "./rodar-menu-principal.js";

function fakePrompts(overrides: Partial<IPromptsMenu>): IPromptsMenu {
  return {
    selecionarComando: async () => "ajuda",
    perguntarAppKey: async () => "app-key-teste",
    perguntarAppSecret: async () => "app-secret-teste",
    ...overrides,
  };
}

describe("rodarMenuPrincipal", () => {
  let dirTemp: string;

  beforeEach(() => {
    dirTemp = mkdtempSync(join(tmpdir(), "omie-data-menu-"));
    process.env.OMIE_DATA_DIR = dirTemp;
  });

  afterEach(() => {
    delete process.env.OMIE_DATA_DIR;
    rmSync(dirTemp, { recursive: true, force: true });
  });

  it("comando 'ajuda' retorna tipo ajuda, sem chamar credencial ou produtos", async () => {
    const resultado = await rodarMenuPrincipal(
      () => {
        throw new Error("não deveria checar credencial pra ajuda");
      },
      () => {
        throw new Error("não deveria criar client pra ajuda");
      },
      async () => {
        throw new Error("não deveria abrir produtos pra ajuda");
      },
      fakePrompts({ selecionarComando: async () => "ajuda" })
    );

    expect(resultado).toEqual({ tipo: "ajuda" });
  });

  it("comando 'configurar' pede app key e app secret e roda rodarConfigurar de verdade", async () => {
    const client = new FakeOmieHttpClient([]);

    const resultado = await rodarMenuPrincipal(
      () => true,
      () => client,
      async () => {
        throw new Error("não deveria abrir produtos pra configurar");
      },
      fakePrompts({
        selecionarComando: async () => "configurar",
        perguntarAppKey: async () => "minha-key",
        perguntarAppSecret: async () => "meu-secret",
      })
    );

    expect(resultado.tipo).toBe("configurar");
    if (resultado.tipo === "configurar") {
      expect(resultado.resultado.status).toBe("ok");
    }
  });

  it("comando 'configurar' propaga falha de validação da API", async () => {
    const clientInvalido: IOmieHttpClient = {
      listarProdutosPagina: async () => {
        throw new Error("Erro de autenticação");
      },
    };

    const resultado = await rodarMenuPrincipal(
      () => true,
      () => clientInvalido,
      async () => {
        throw new Error("não deveria abrir produtos pra configurar");
      },
      fakePrompts({ selecionarComando: async () => "configurar" })
    );

    expect(resultado).toEqual({
      tipo: "configurar",
      resultado: { status: "invalido", erro: "Erro de autenticação" },
    });
  });

  it("comando 'produtos' sem credencial retorna produtos_sem_credencial, sem abrir produtos", async () => {
    const resultado = await rodarMenuPrincipal(
      () => false,
      () => {
        throw new Error("não deveria criar client");
      },
      async () => {
        throw new Error("não deveria abrir produtos sem credencial");
      },
      fakePrompts({ selecionarComando: async () => "produtos" })
    );

    expect(resultado).toEqual({ tipo: "produtos_sem_credencial" });
  });

  it("comando 'produtos' com credencial abre produtos e repassa a saída ('voltar' ou 'sair')", async () => {
    const resultado = await rodarMenuPrincipal(
      () => true,
      () => {
        throw new Error("não deveria criar client de configurar");
      },
      async () => "voltar",
      fakePrompts({ selecionarComando: async () => "produtos" })
    );

    expect(resultado).toEqual({ tipo: "produtos", saida: "voltar" });
  });

  it("comando 'sair' retorna tipo sair, sem chamar credencial ou produtos", async () => {
    const resultado = await rodarMenuPrincipal(
      () => {
        throw new Error("não deveria checar credencial pra sair");
      },
      () => {
        throw new Error("não deveria criar client pra sair");
      },
      async () => {
        throw new Error("não deveria abrir produtos pra sair");
      },
      fakePrompts({ selecionarComando: async () => "sair" })
    );

    expect(resultado).toEqual({ tipo: "sair" });
  });
});

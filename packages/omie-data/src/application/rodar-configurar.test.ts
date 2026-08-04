import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FakeOmieHttpClient } from "../infrastructure/fake-omie-http-client.js";
import { carregarCredencialAtiva, hashCredencial } from "../infrastructure/credenciais.js";
import { rodarConfigurar } from "./rodar-configurar.js";
import { IOmieHttpClient } from "../domain/omie-http-client.js";

describe("rodarConfigurar", () => {
  let dirTemp: string;

  beforeEach(() => {
    dirTemp = mkdtempSync(join(tmpdir(), "omie-data-cfg-"));
    process.env.OMIE_DATA_DIR = dirTemp;
  });

  afterEach(() => {
    delete process.env.OMIE_DATA_DIR;
    rmSync(dirTemp, { recursive: true, force: true });
  });

  it("salva a credencial quando a validação funciona", async () => {
    const client = new FakeOmieHttpClient([]);

    const resultado = await rodarConfigurar("app-key-valida", "app-secret-valido", client);

    expect(resultado).toEqual({ status: "ok", hash: hashCredencial("app-key-valida") });
    expect(carregarCredencialAtiva()?.appKey).toBe("app-key-valida");
  });

  it("não salva nada quando a validação falha", async () => {
    const clientInvalido: IOmieHttpClient = {
      listarProdutosPagina: async () => {
        throw new Error("Erro de autenticação");
      },
    };

    const resultado = await rodarConfigurar("app-key-invalida", "app-secret-invalido", clientInvalido);

    expect(resultado).toEqual({ status: "invalido", erro: "Erro de autenticação" });
    expect(carregarCredencialAtiva()).toBeNull();
  });
});

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  carregarCredencialAtiva,
  hashCredencial,
  salvarCredencial,
} from "./credenciais.js";

describe("credenciais", () => {
  let dirTemp: string;

  beforeEach(() => {
    dirTemp = mkdtempSync(join(tmpdir(), "omie-data-cred-"));
    process.env.OMIE_DATA_DIR = dirTemp;
  });

  afterEach(() => {
    delete process.env.OMIE_DATA_DIR;
    rmSync(dirTemp, { recursive: true, force: true });
  });

  it("hashCredencial é determinístico para o mesmo App Key", () => {
    expect(hashCredencial("abc123")).toBe(hashCredencial("abc123"));
    expect(hashCredencial("abc123")).not.toBe(hashCredencial("outro"));
  });

  it("carregarCredencialAtiva retorna null quando nada foi salvo", () => {
    expect(carregarCredencialAtiva()).toBeNull();
  });

  it("salva e depois carrega a credencial ativa", () => {
    const hash = salvarCredencial("minha-app-key", "meu-app-secret");

    const credencial = carregarCredencialAtiva();

    expect(credencial).not.toBeNull();
    expect(credencial!.hash).toBe(hash);
    expect(credencial!.appKey).toBe("minha-app-key");
    expect(credencial!.appSecret).toBe("meu-app-secret");
  });

  it("ao salvar uma segunda credencial, ela passa a ser a ativa", () => {
    salvarCredencial("app-key-antiga", "secret-antigo");
    const hashNova = salvarCredencial("app-key-nova", "secret-novo");

    const credencial = carregarCredencialAtiva();

    expect(credencial!.hash).toBe(hashNova);
    expect(credencial!.appKey).toBe("app-key-nova");
  });
});

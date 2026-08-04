import path from "node:path";
import { pathToFileURL } from "node:url";
import { abrirBanco } from "./infrastructure/database.js";
import { carregarCredencialAtiva } from "./infrastructure/credenciais.js";
import { diretorioDados } from "./infrastructure/caminhos.js";
import { OmieHttpClientReal } from "./infrastructure/omie-http-client-real.js";
import { rodarConfigurar } from "./application/rodar-configurar.js";
import { rodarProdutos } from "./application/rodar-produtos.js";

export type ComandoCli =
  | { tipo: "configurar"; appKey: string; appSecret: string }
  | { tipo: "produtos"; atualizar: boolean }
  | { tipo: "desconhecido" };

function valorDaFlag(resto: string[], flag: string): string | undefined {
  const indice = resto.indexOf(flag);
  if (indice === -1) return undefined;
  const valor = resto[indice + 1];
  if (!valor || valor.trim() === "" || valor.startsWith("--")) return undefined;
  return valor;
}

export function parseArgv(argv: string[]): ComandoCli {
  const [sub, ...resto] = argv;

  if (sub === "configurar") {
    const appKey = valorDaFlag(resto, "--app-key");
    const appSecret = valorDaFlag(resto, "--app-secret");
    if (!appKey || !appSecret) return { tipo: "desconhecido" };
    return { tipo: "configurar", appKey, appSecret };
  }

  if (sub === "produtos") {
    return { tipo: "produtos", atualizar: resto.includes("--atualizar") };
  }

  return { tipo: "desconhecido" };
}

async function main() {
  const comando = parseArgv(process.argv.slice(2));

  if (comando.tipo === "configurar") {
    try {
      const client = new OmieHttpClientReal(comando.appKey, comando.appSecret);
      const resultado = await rodarConfigurar(comando.appKey, comando.appSecret, client);
      console.log(JSON.stringify(resultado));
      process.exitCode = resultado.status === "ok" ? 0 : 1;
    } catch (erro) {
      console.log(JSON.stringify({ status: "erro", erro: erro instanceof Error ? erro.message : String(erro) }));
      process.exitCode = 1;
    }
    return;
  }

  if (comando.tipo === "produtos") {
    const credencial = carregarCredencialAtiva();
    if (!credencial) {
      console.log(JSON.stringify({ status: "sem_credencial" }));
      process.exitCode = 1;
      return;
    }

    let db;
    try {
      db = abrirBanco(path.join(diretorioDados(), `${credencial.hash}.db`));
      const client = new OmieHttpClientReal(credencial.appKey, credencial.appSecret);
      const resultado = await rodarProdutos(db, client, comando.atualizar);
      console.log(JSON.stringify(resultado));
      process.exitCode = 0;
    } catch (erro) {
      console.log(JSON.stringify({ status: "erro", erro: erro instanceof Error ? erro.message : String(erro) }));
      process.exitCode = 1;
    } finally {
      db?.close();
    }
    return;
  }

  console.error("Comando desconhecido. Uso: cli.js configurar --app-key X --app-secret Y | cli.js produtos [--atualizar]");
  process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

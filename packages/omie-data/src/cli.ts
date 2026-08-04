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

export function parseArgv(argv: string[]): ComandoCli {
  const [sub, ...resto] = argv;

  if (sub === "configurar") {
    const indiceKey = resto.indexOf("--app-key");
    const indiceSecret = resto.indexOf("--app-secret");
    if (indiceKey === -1 || indiceSecret === -1) return { tipo: "desconhecido" };
    return {
      tipo: "configurar",
      appKey: resto[indiceKey + 1],
      appSecret: resto[indiceSecret + 1],
    };
  }

  if (sub === "produtos") {
    return { tipo: "produtos", atualizar: resto.includes("--atualizar") };
  }

  return { tipo: "desconhecido" };
}

async function main() {
  const comando = parseArgv(process.argv.slice(2));

  if (comando.tipo === "configurar") {
    const client = new OmieHttpClientReal(comando.appKey, comando.appSecret);
    const resultado = await rodarConfigurar(comando.appKey, comando.appSecret, client);
    console.log(JSON.stringify(resultado));
    process.exit(resultado.status === "ok" ? 0 : 1);
  }

  if (comando.tipo === "produtos") {
    const credencial = carregarCredencialAtiva();
    if (!credencial) {
      console.log(JSON.stringify({ status: "sem_credencial" }));
      process.exit(1);
    }

    const db = abrirBanco(path.join(diretorioDados(), `${credencial.hash}.db`));
    const client = new OmieHttpClientReal(credencial.appKey, credencial.appSecret);
    const resultado = await rodarProdutos(db, client, comando.atualizar);
    db.close();
    console.log(JSON.stringify(resultado));
    process.exit(0);
  }

  console.error("Comando desconhecido. Uso: cli.js configurar --app-key X --app-secret Y | cli.js produtos [--atualizar]");
  process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

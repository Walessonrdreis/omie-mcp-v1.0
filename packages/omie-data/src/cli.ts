import path from "node:path";
import { pathToFileURL } from "node:url";
import { abrirBanco } from "./infrastructure/database.js";
import { carregarCredencialAtiva } from "./infrastructure/credenciais.js";
import { diretorioDados } from "./infrastructure/caminhos.js";
import { OmieHttpClientReal } from "./infrastructure/omie-http-client-real.js";
import { rodarConfigurar } from "./application/rodar-configurar.js";
import { rodarProdutos } from "./application/rodar-produtos.js";
import { rodarAjudaInterativa } from "./application/rodar-ajuda-interativo.js";
import { FiltrosProdutos } from "./application/consultar-produtos.js";

export type ComandoCli =
  | { tipo: "configurar"; appKey: string; appSecret: string }
  | { tipo: "produtos"; atualizar: boolean; ajuda: boolean; filtros: FiltrosProdutos }
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
    const filtros: FiltrosProdutos = {};

    const busca = valorDaFlag(resto, "--busca");
    if (busca) filtros.busca = busca;

    const categoria = valorDaFlag(resto, "--categoria");
    if (categoria) filtros.categoria = categoria;

    const ativoBruto = valorDaFlag(resto, "--ativo");
    if (ativoBruto !== undefined) {
      const normalizado = ativoBruto.toLowerCase();
      if (normalizado === "sim") filtros.ativo = "Sim";
      else if (normalizado === "nao" || normalizado === "não") filtros.ativo = "Não";
      else return { tipo: "desconhecido" };
    }

    return {
      tipo: "produtos",
      atualizar: resto.includes("--atualizar"),
      ajuda: resto.includes("--ajuda"),
      filtros,
    };
  }

  return { tipo: "desconhecido" };
}

export function textoAjudaProdutos(): string {
  return [
    "Filtros disponíveis em 'produtos':",
    "  --busca <texto>      ex: produtos --busca arroz",
    "  --categoria <texto>  ex: produtos --categoria bebida",
    "  --ativo <sim|nao>    ex: produtos --ativo sim",
  ].join("\n");
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

    if (comando.ajuda && !process.stdout.isTTY) {
      console.log(textoAjudaProdutos());
      process.exitCode = 0;
      return;
    }

    let db;
    try {
      db = abrirBanco(path.join(diretorioDados(), `${credencial.hash}.db`));
      const client = new OmieHttpClientReal(credencial.appKey, credencial.appSecret);

      if (comando.ajuda) {
        const resultado = await rodarAjudaInterativa(db, client, comando.atualizar);
        console.log(JSON.stringify(resultado));
        process.exitCode = 0;
        return;
      }

      const resultado = await rodarProdutos(db, client, comando.atualizar, comando.filtros);
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

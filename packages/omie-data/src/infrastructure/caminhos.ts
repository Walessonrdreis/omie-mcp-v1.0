import path from "node:path";

export function diretorioDados(): string {
  return process.env.OMIE_DATA_DIR ?? path.join(process.cwd(), "data", "omie-data");
}

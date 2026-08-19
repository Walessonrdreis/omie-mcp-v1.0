import { homedir } from "node:os";
import path from "node:path";

export function diretorioDados(): string {
  return process.env.OMIE_DATA_DIR ?? path.join(homedir(), ".omie-data");
}

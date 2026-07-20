// PostToolUse hook (Edit|Write) — lembra de registrar a implementação em
// docs/CONTEXTO-SESSOES.md (skill memoria-sessao) quando um arquivo dentro
// de src/ é alterado. Só imprime algo (o que injeta contexto na resposta)
// quando o file_path bate com src/ — silencioso pra qualquer outro arquivo.
let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  try {
    const input = JSON.parse(raw);
    const filePath = input?.tool_input?.file_path ?? "";
    if (/(^|[\\/])src[\\/]/.test(filePath)) {
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: "PostToolUse",
            additionalContext:
              "Lembrete: se esta edição concluiu uma implementação relevante, registre em " +
              "docs/CONTEXTO-SESSOES.md (skill memoria-sessao) antes de seguir para a próxima tarefa.",
          },
        })
      );
    }
  } catch {
    // entrada não é JSON válido — não faz nada
  }
});

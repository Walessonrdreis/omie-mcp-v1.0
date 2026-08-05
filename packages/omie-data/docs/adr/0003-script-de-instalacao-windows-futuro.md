---
status: proposed
---

# Script de instalação (.ps1) pra Windows — ideia futura, não implementada

Hoje instalar o `omie-data` numa nova máquina exige passos manuais: clonar o repositório, `npm --prefix packages/omie-data install`, `npm run build`, `npm link` (pra ter o atalho `omie-data` global no terminal), configurar a credencial da Omie, e ter o Claude Code instalado apontando pro repositório (pra os comandos `/omie-data:*` funcionarem). Quando for automatizar isso, a decisão é usar um **script PowerShell (.ps1)** que executa esses passos em sequência — não um executável standalone (`.exe` via `pkg` ou `--experimental-sea-config`).

Alternativa considerada e rejeitada (por enquanto): empacotar um `.exe` com o runtime do Node embutido, o que dispensaria ter Node.js/npm pré-instalados na máquina de destino. Rejeitada porque essa ferramenta é de uso pessoal (não um produto distribuído pra terceiros sem conhecimento técnico), e um `.exe` não resolveria o problema todo mesmo assim — os comandos `/omie-data:*` sempre vão depender do repositório clonado e do Claude Code instalado apontando pra ele, então empacotar só o CLI deixaria a instalação ainda incompleta. Um script `.ps1` simples, assumindo Node.js/npm já presentes, cobre o caso real de uso (o próprio usuário instalando em outro computador seu) com muito menos esforço de manutenção.

Escopo do script quando for implementado: clonar/copiar o repositório (ou assumir que já está clonado), rodar install + build, rodar `npm link`, e opcionalmente já disparar o fluxo de Configurar (App Key/App Secret) ao final.

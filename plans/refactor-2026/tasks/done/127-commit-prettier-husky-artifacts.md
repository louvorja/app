---
id: 127
title: Commit orphaned Prettier/Husky tooling artifacts
slug: commit-prettier-husky-artifacts
category: tooling
wave: 2
model: sonnet
priority: P1
estimate_hours: 0.25
status: done
depends_on: [067, 068]
blocks: []
audit_items: []
---

# [127] Commit orphaned Prettier/Husky tooling artifacts

## Contexto

Tasks #067 (Prettier) e #068 (Husky + lint-staged) foram marcadas `done` e as notas
pós-execução confirmam que os artefatos foram criados e testados. Porém os arquivos
de configuração nunca foram adicionados ao git:

- `.prettierrc.json` — config do Prettier (untracked)
- `.prettierignore` — padrões ignorados (untracked)
- `.husky/pre-commit` — hook que chama `lint-staged` (untracked)

Consequência: qualquer `git clone` fresco não terá a config do Prettier nem o
pre-commit hook funcionando, mesmo que `npm install` instale as deps.

O `package.json` já contém todas as deps (`prettier`, `husky`, `lint-staged`) e a
config `lint-staged` — apenas os arquivos de artefato estão faltando no repositório.

## Objetivo

- Commitar `.prettierrc.json`, `.prettierignore` e `.husky/pre-commit`.
- Verificar que `npx prettier --check "src/**/*.vue"` passa sem erros.
- Verificar que `npm run build` e `npm run lint` continuam passando.

## Escopo

### Dentro
- Adicionar ao git e commitar os 3 arquivos untracked das tasks #067/#068.
- Corrigir eventuais arquivos com formatação fora do padrão (rodar `npm run format`
  e commitar separado caso haja diff).

### Fora
- **NÃO** alterar lógica de negócio nem configuração existente.
- **NÃO** commitar `.husky/_/` — está gitignored pelo próprio Husky (`_/.gitignore`
  contém `*`).
- **NÃO** refatorar o lint-staged config já presente em `package.json`.

## Arquivos afetados

- `.prettierrc.json` (adicionar ao git)
- `.prettierignore` (adicionar ao git)
- `.husky/pre-commit` (adicionar ao git)
- Eventuais `.vue`/`.js` com formatação fora do padrão (commitar separado)

## Plano de execução

1. Verificar se o Prettier passa:
   ```bash
   npx prettier --check "src/**/*.vue"
   ```
   Se houver erros: `npm run format` + commitar como `style: apply Prettier formatting`.

2. Adicionar e commitar os artefatos:
   ```bash
   git add .prettierrc.json .prettierignore .husky/pre-commit
   git commit -m "[127] Commit missing Prettier/Husky config files"
   ```

3. Verificar build e lint:
   ```bash
   npm run lint
   npm run build
   ```

## Validação

- [ ] `npx prettier --check "src/**/*.vue"` → All matched files use Prettier code style!
- [ ] `git ls-files .prettierrc.json .prettierignore .husky/pre-commit` → mostra os 3 arquivos.
- [ ] `npm run lint` → exit code 0.
- [ ] `npm run build` → exit code 0.

## Riscos / atenções

- **`.husky/_/`**: Não commitar. Está corretamente gitignored pelo Husky.
- **Hook ativo localmente**: o pre-commit já está ativo no ambiente do dev; commitar
  os arquivos apenas torna isso reproduzível para outros devs.

---
id: 069
title: Documentar/corrigir porta dev (5002 vs 5173 padrão)
slug: corrigir-porta-dev
category: tooling
wave: 2
model: sonnet
priority: P2
estimate_hours: 0.5
status: done
depends_on: []
blocks: []
audit_items: [69]
---

# [069] Documentar/corrigir porta dev

## Contexto

`vite.config.js:109` define `server: { port: 5002 }`. A porta padrão do Vite é 5173. Não há documentação de por que 5002 foi escolhido (possível conflito com outro serviço, ou legado do servidor Delphi que usava essa porta).

Impacto: desenvolvedores que não leram o vite.config.js tentam acessar `http://localhost:5173` e não encontram nada. O CLAUDE.md menciona `npm run dev` mas não menciona a porta.

Também há `npm run host` que expõe na rede — útil para testes em dispositivos, mas não documentado.

## Objetivo

- Verificar se 5002 tem razão de ser (conflito com servidor local, Electron, etc).
- Se não há razão técnica, avaliar se vale mudar para 5173 (padrão) ou documentar explicitamente.
- Atualizar CLAUDE.md com a porta correta.
- Confirmar que `npm run host` também está documentado.

## Escopo

### Dentro
- Verificar por que 5002 foi escolhido.
- Documentar a porta no CLAUDE.md (seção Comandos).
- Se for mudar a porta → atualizar `vite.config.js` e qualquer referência hardcoded à porta.

### Fora
- **NÃO** mudar configuração do Electron (que pode usar porta diferente).

## Arquivos afetados

- `vite.config.js` (possivelmente)
- `CLAUDE.md` (atualizar seção de comandos)

## Plano de execução

1. **Branch:** `git checkout -b chore/069-corrigir-porta-dev`

2. **Investigar:** 
   ```bash
   grep -rn "5002\|5173\|localhost:" \
     src/ electron/ package.json --include="*.js" --include="*.vue" --include="*.json" 2>/dev/null
   ```
   Verificar se `5002` aparece em algum lugar que justifique o uso (handshake Electron, servidor Delphi, etc).

3. **Verificar `package.json:scripts`:**
   ```bash
   cat package.json | python3 -c "import sys,json; d=json.load(sys.stdin); [print(k,':',v) for k,v in d['scripts'].items()]"
   ```
   O script `electron:dev` pode referenciar a porta para o `loadURL`.

4. **Decisão:**
   - Se 5002 é necessária (ex: `electron/main.cjs` faz `loadURL("http://localhost:5002")`): **manter** e apenas documentar.
   - Se 5002 é arbitrária: **mudar para 5173** (padrão Vite) para reduzir surpresas.

5. **Atualizar CLAUDE.md** na seção `## Comandos`:
   ```markdown
   npm run dev          # Servidor de desenvolvimento web/PWA em http://localhost:5002
   npm run host         # Dev exposto na rede (http://<ip-local>:5002) — útil para testes mobile
   ```

6. **Se mudar a porta**, atualizar todos os lugares que referenciam `5002`:
   ```bash
   grep -rn "5002" . --exclude-dir=node_modules --exclude-dir=.git
   ```

7. **Commit + PR:**
   ```
   [069] Document dev server port and update CLAUDE.md
   ```

## Validação

- [ ] CLAUDE.md menciona a porta do servidor de dev.
- [ ] Se porta mudou: `npm run dev` responde na nova porta.
- [ ] Se porta mudou: `electron:dev` ainda funciona (não quebrou o `loadURL`).
- [ ] `npm run build` passa.

## Riscos / atenções

- **Electron `loadURL`**: o main process do Electron faz `win.loadURL("http://localhost:5002")` em dev. Se mudar a porta, precisa mudar lá também — e vice-versa. Verificar `electron/main.cjs`.

## Referências

- Item audit: #69.
- `vite.config.js:109`: [vite.config.js:109](../../vite.config.js#L109)

---

## Notas pós-execução

- **Decisão:** manter porta 5002. É deliberada — `electron/main.cjs:47` define `const DEV_URL = "http://localhost:5002"` e o script `electron:dev` usa `wait-on http://localhost:5002`. Mudar exigiria atualizar três arquivos em sincronia.
- **CLAUDE.md** atualizado: porta explicitada em `npm run dev` e `npm run host`, nota sobre a porta adicionada abaixo do bloco de comandos.
- Sem mudanças em `vite.config.js`.

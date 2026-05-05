---
id: 055
title: Validar idioma es end-to-end
slug: validar-es-end-to-end
category: i18n
wave: bugs
model: sonnet
priority: P3
estimate_hours: 2
status: todo
depends_on: [052]
blocks: []
audit_items: [55]
---

# [055] Validar idioma `es` E2E

## Contexto

Task #052 (done) moveu strings hardcoded para i18n. Falta validar que o app funciona 100% em espanhol — sem strings hardcoded restantes, sem traduções faltando, sem keys com fallback para inglês/português.

## Objetivo

- App em ES: nenhuma string PT/EN visível.
- Todos os módulos abrem e funcionam em ES.
- Lint i18n (vue-i18n@9 tem `@intlify/eslint-plugin-vue-i18n`) sem erros.

## Escopo

### Dentro
- Smoke completo do app em modo ES.
- Audit de keys faltando em `src/lang/es.json` e `src/modules/*/lang/es.json`.

### Fora
- **NÃO** mover novas strings para i18n — escopo já feito em #052.

## Arquivos afetados

- Audit em `src/lang/es.json` + `src/modules/*/lang/es.json`.

## Plano de execução

1. Branch `i18n/055-validar-es`.
2. Trocar idioma para ES no app.
3. Abrir cada módulo e clicar em todos os controles.
4. Anotar strings PT visíveis ou keys faltantes (`?key.path?`).
5. Para cada key faltante: adicionar tradução ES.
6. Comparar `pt.json` vs `es.json` — verificar paridade de chaves.
7. Commit: `[055] Validate and complete Spanish translations`.

## Validação

- [ ] `node -e "console.log(JSON.stringify(diff(require('./src/lang/pt.json'), require('./src/lang/es.json'))))"` — chaves missing = 0.
- [ ] Smoke completo em ES sem strings PT visíveis.

## Referências

- Item audit: #55.
- Task #052 (done).

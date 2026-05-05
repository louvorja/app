---
id: 098
title: Decidir modules/core/ permanece ou achata
slug: modules-core-flat
category: convencao
wave: convencao
model: sonnet
priority: P3
estimate_hours: 0.5
status: done
depends_on: []
blocks: []
audit_items: [98]
---

# [098] modules/core/ — decisão arquitetural

## Contexto

Os módulos vivem em `src/modules/core/<id>/`. O `core/` foi criado prevendo `src/modules/contrib/` ou `src/modules/plugins/` para módulos de terceiros. Mas isso nunca aconteceu — todos os 22 módulos são `core`.

Decisão a tomar:
- **Manter `core/`**: prepara para futuros módulos contrib.
- **Achatar para `modules/<id>/`**: simplifica caminhos, tira pasta inútil.

Se não há plano concreto de adicionar contrib na próxima onda, achatar.

## Objetivo

- Decisão registrada em ADR (Architecture Decision Record).
- Se achatar: `git mv src/modules/core/* src/modules/`.

## Escopo

### Dentro
- Discutir com o time/dono.
- Documentar decisão.
- Aplicar movimentação se decidir achatar.

### Fora
- **NÃO** mudar a estrutura interna de cada módulo.

## Arquivos afetados

- Todos os módulos em `src/modules/core/*/`.
- ModuleManager.js (paths de import).
- CLAUDE.md.

## Plano de execução

1. Discussão com dono → registrar decisão em `docs/adr/`.
2. Se achatar:
   ```bash
   git mv src/modules/core/* src/modules/
   rmdir src/modules/core
   ```
3. Atualizar `ModuleManager.js` para usar novo path.
4. Atualizar CLAUDE.md.
5. Commit: `[098] Flatten modules/core/ to modules/` ou `[098] ADR: keep modules/core/ for future contrib`.

## Validação

- [ ] ADR criado em `docs/adr/`.
- [ ] Se achatado: `npm run build` passa, todos módulos abrem.

## Referências

- Item audit: #98.
- ADR exemplo: [docs/adr/0001-vuetify-versao-estavel.md](../../docs/adr/0001-vuetify-versao-estavel.md).

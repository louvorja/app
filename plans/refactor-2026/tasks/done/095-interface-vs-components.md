---
id: 095
title: Padronizar nomenclatura interface/ vs components/
slug: interface-vs-components
category: convencao
wave: convencao
model: sonnet
priority: P3
estimate_hours: 2
status: todo
depends_on: []
blocks: []
audit_items: [95]
---

# [095] Padronizar interface/ vs components/

## Contexto

Módulos core usam `interface/` para guardar `Index.vue` e sub-componentes do módulo:
```
src/modules/core/liturgy/interface/
├── Index.vue
├── LiturgyItem.vue
└── LiturgyTimer.vue
```

Já em `src/components/` ficam componentes globais reutilizáveis. A pasta `interface/` é um nome herdado (provavelmente do código Delphi original) que não traduz bem em projeto Vue moderno — Vue não tem o conceito de "interface" para componentes. Devs novos confundem.

Opções:
1. Renomear `interface/` → `components/` em cada módulo.
2. Manter `interface/` mas documentar a convenção.

Recomendação: renomear para `components/` — convenção mais idiomática.

## Objetivo

- `src/modules/core/<id>/interface/` → `src/modules/core/<id>/components/`.
- Imports atualizados em todo o projeto.
- CLAUDE.md atualizado com a nova convenção.

## Escopo

### Dentro
- Renomear pasta em todos os módulos core.
- Atualizar imports + manifest se referenciar paths.

### Fora
- **NÃO** mover `Index.vue` para fora dessa pasta.

## Arquivos afetados

- Todos os `src/modules/core/*/interface/` → `components/`.
- Imports em `index.js` de cada módulo.
- [CLAUDE.md](../../CLAUDE.md) (estrutura de módulos).

## Plano de execução

1. Branch `chore/095-interface-to-components`.
2. Para cada módulo:
   ```bash
   git mv src/modules/core/<id>/interface src/modules/core/<id>/components
   ```
3. Atualizar imports:
   ```bash
   grep -rln "interface/Index" src/ | xargs sed -i '' 's|interface/Index|components/Index|g'
   ```
4. Atualizar CLAUDE.md.
5. `npm run build` passa.
6. Commit: `[095] Rename modules' interface/ to components/`.

## Validação

- [ ] `find src/modules/core -type d -name interface` retorna 0.
- [ ] `npm run build` passa.
- [ ] Smoke: cada módulo abre normalmente.

## Riscos / atenções

- **ModuleManager dynamic imports**: se usa `interface/Index.vue` como path, atualizar.

## Referências

- Item audit: #95.
- [CLAUDE.md](../../CLAUDE.md) seção "Convenções de Módulos".

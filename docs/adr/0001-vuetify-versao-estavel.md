# ADR 0001 — Travar Vuetify na versão estável 4.x

**Data:** 2026-05-03
**Responsável:** Juan Aleixo
**Status:** aceito

## Contexto

O projeto declarava `"vuetify": "^4.0.0"` enquanto Vuetify 4 ainda estava em alpha.
Usar `^` com um alvo alpha expõe o projeto a breaking changes silenciosas a cada minor que o npm baixar.

A RFC [058](../../plans/refactor-2026/tasks/058-rfc-vuetify-decision.md) avaliou duas opções:

1. Regredir para Vuetify 3 estável (`~3.x`)
2. Aguardar Vuetify 4 estável e travar nessa versão

## Decisão

**Manter Vuetify 4, travado em `~4.0.6`** (tilde — apenas patches automáticos).

Ao executar esta task, `npm view vuetify dist-tags` confirmou:

```
latest: 4.0.6
v3-stable: 3.12.5
```

O critério de reconsideração da RFC foi atingido: Vuetify 4 lançou sua primeira versão estável sem prerelease flag (`4.0.0`–`4.0.6`). Downgrading para v3 passaria a ser custo sem benefício.

## Consequências

- Pin `~4.0.6` permite apenas patches (`4.0.x`) sem aprovar bumps de minor.
- `v-number-input` continua disponível em v4 — nenhuma substituição necessária.
- `vite-plugin-vuetify@^2.1.3` é compatível com v4 — sem mudanças no plugin.
- Plugin `src/plugins/vuetify.js` (`createVuetify` + themes) sem alterações.

## Quando reconsiderar

- Upgrade para `~4.1.x` ou superior: avaliar changelog do Vuetify para breaking changes antes de bumpar o tilde.
- Se surgir regressão visual crítica travada em um patch do Vuetify: pinnar versão exata (`4.0.6`) temporariamente.

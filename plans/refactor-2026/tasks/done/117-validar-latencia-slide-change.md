---
id: 117
title: Validar latência <50ms slide_change Operator→Projection
slug: validar-latencia-slide-change
category: electron
wave: electron
model: opus
priority: P2
estimate_hours: 4
status: todo
depends_on: [116]
blocks: []
audit_items: [117]
---

# [117] Latência slide_change <50ms

## Contexto

Em ambiente de culto, o operador clica em "próximo slide" no Operator e o slide deve aparecer na projeção (segundo monitor) em <50ms. Latência maior é perceptível e quebra o fluxo da apresentação. Roadmap D4/D7 define 50ms como meta.

Atualmente não há medição. BroadcastChannel + render Vue + DOM update somam latência variável. Esta task instrumenta a medição e otimiza pontos quentes.

## Objetivo

- Medição automatizada da latência slide_change.
- 95-percentil <50ms em Electron (release build).
- Documentação dos pontos otimizados.

## Escopo

### Dentro
- Instrumentação `performance.now()` em emissor + consumidor.
- Repetir 100x e calcular p50/p95/p99.
- Otimizações pontuais se necessário.

### Fora
- **NÃO** redesenhar arquitetura — apenas medir e otimizar.

## Arquivos afetados

- [src/views/Projection.vue](../../src/views/Projection.vue) (instrumentação)
- [src/views/Operator.vue](../../src/views/Operator.vue) (instrumentação)
- Possivelmente Media.js + composables.

## Plano de execução

1. Branch `electron/117-latencia-slide`.
2. Instrumentar:
   ```js
   // Emissor (Media.js ou Operator)
   const ts = performance.now();
   broadcast.send(BROADCAST_TYPE.SLIDE_CHANGE, { ...payload, _ts: ts });
   ```
   ```js
   // Consumidor (Projection.vue)
   listener(msg) {
     const latency = performance.now() - msg._ts;
     console.log('latency', latency);
   }
   ```
3. Rodar 100 navegações automatizadas (Playwright pós #089).
4. Coletar p50/p95/p99.
5. Se >50ms p95: otimizar:
   - `requestAnimationFrame` para batching.
   - Reduzir reactivity profunda (Vue.markRaw em payload grande).
   - Limit de re-renders (debounce ou raf).
6. Commit: `[117] Instrument and optimize slide_change latency`.

## Validação

- [ ] p95 latency <50ms no Electron release build.
- [ ] Documentação das otimizações em comentário.

## Referências

- Item audit: #117.
- Roadmap D7 — `requestAnimationFrame` para sincronia ±50ms.

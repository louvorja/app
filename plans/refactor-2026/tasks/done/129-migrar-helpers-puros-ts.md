---
id: 129
title: Migrar helpers puros para TypeScript (Strings, DateTime, AudioBeep, Dom)
slug: migrar-helpers-puros-ts
category: typescript
wave: 4
model: sonnet
priority: P2
estimate_hours: 1
status: done
depends_on: [002]
blocks: []
audit_items: [2]
---

# [129] Migrar helpers puros para TypeScript

## Contexto

A task #002 migrou os helpers críticos (`Storage`, `AppData`, `UserData`, `Database`,
`Broadcast`, `Path`) para TypeScript. Restam helpers puros simples que não têm deps Vue/Pinia
e são imediatos de tipar. Tipá-los elimina `any` implícito nos callers `.ts` que já importam
esses arquivos (ex: `useMedia.ts`, `useModule.ts`).

Arquivos em escopo (157 linhas total):

| Arquivo | Linhas | Callers em .ts |
|---------|--------|---------------|
| `Strings.js` | 31 | `useModule.ts`, `main.js`, `DataTable.vue`, `Slide.vue`, `collections/Index.vue` |
| `DateTime.js` | 31 | `useMedia.ts`, `useModule.ts`, `Footer.vue`, `PlayerProgress.vue`, `hymnal/Index.vue`, `musics/Index.vue`, `main.js` |
| `AudioBeep.js` | 29 | `useLiturgyTimer.js`, `stopwatch/Index.vue` |
| `Dom.js` | 4 | `bible/Index.vue` |

`ModuleTypes.js` (62 linhas) — excluído: zero importers, dead code.

## Objetivo

Renomear os 4 arquivos de `.js` para `.ts` e adicionar anotações de tipo explícitas. Sem
reescrever lógica.

## Escopo

### Dentro
- Renomear `.js` → `.ts` nos 4 arquivos.
- Anotar parâmetros e retornos com tipos TypeScript.
- Atualizar o import de `AudioBeep` em `useLiturgyTimer.js` (usa extensão `.js` explícita).
- `npm run build` e `npm run lint` passando.

### Fora
- **NÃO** reescrever lógica.
- **NÃO** converter callers para `.ts` — só os helpers.
- **NÃO** tocar `ModuleTypes.js` (dead code — tarefa separada de cleanup).
- **NÃO** tocar `Platform.js`, `SljaConverter.js`, `Hotkeys.js`, `CommandRegistry.js` — fora do escopo.

## Arquivos afetados

- `src/helpers/Strings.js` → `Strings.ts`
- `src/helpers/DateTime.js` → `DateTime.ts`
- `src/helpers/AudioBeep.js` → `AudioBeep.ts`
- `src/helpers/Dom.js` → `Dom.ts`
- `src/modules/liturgy/composables/useLiturgyTimer.js` — atualizar import (remover extensão `.js`)

## Pré-requisitos

- `tsconfig.json` com `allowJs: true` já configurado (task #002 done).

## Plano de execução

1. Branch `refactor/129-helpers-puros-ts`.

2. **`Strings.ts`** — exportar `default` com tipos:
   ```typescript
   export default {
     clean(text: string): string { ... },
     sort(a: string | number, b: string | number): number { ... },
   };
   ```

3. **`DateTime.ts`** — anotar `time: number | string` em `shortTime`, `time: string` em `toNumber`:
   ```typescript
   export default {
     shortTime(time: number | string): string { ... },
     toNumber(time: string): number { ... },
   };
   ```

4. **`AudioBeep.ts`** — tipar `_ctx: AudioContext | null`, adicionar `declare global` para
   `window.webkitAudioContext`, anotar parâmetros com defaults:
   ```typescript
   declare global {
     interface Window { webkitAudioContext?: typeof AudioContext; }
   }
   let _ctx: AudioContext | null = null;
   export function playBeep(frequency = 880, duration = 0.2, volume = 0.5, delaySeconds = 0): void { ... }
   ```

5. **`Dom.ts`** — anotar `el: Element | null | undefined`, `opts: ScrollIntoViewOptions`:
   ```typescript
   export function scrollToElement(el: Element | null | undefined, opts: ScrollIntoViewOptions = {}): void { ... }
   ```

6. **`useLiturgyTimer.js`** — atualizar import:
   ```js
   // de: import { playBeep } from "@helpers/AudioBeep.js";
   // para:
   import { playBeep } from "@helpers/AudioBeep";
   ```

7. `npm run build` — corrigir erros de tipo se aparecerem.

8. `npm run lint` — corrigir avisos.

9. Commit: `[129] Migrate pure helpers to TypeScript (Strings, DateTime, AudioBeep, Dom)`.

10. Atualizar BACKLOG: `#129 → done`.

## Validação

- [ ] `ls src/helpers/Strings.ts src/helpers/DateTime.ts src/helpers/AudioBeep.ts src/helpers/Dom.ts` — todos existem.
- [ ] `ls src/helpers/Strings.js src/helpers/DateTime.js src/helpers/AudioBeep.js src/helpers/Dom.js` — nenhum existe.
- [ ] `grep "AudioBeep\.js" src/modules/liturgy/composables/useLiturgyTimer.js` — retorna vazio.
- [ ] `npm run build` exit code 0.
- [ ] `npm run lint` exit code 0.

## Riscos / atenções

- `window.webkitAudioContext` não está no tipo `Window` padrão do TypeScript — declarar com `declare global`.
- `isNaN(time as number)` em `DateTime.shortTime`: TypeScript pode reclamar de `isNaN` com `string` — usar `typeof time === "string"` como discriminador é mais correto.
- Callers em `.js`/`.vue` (sem `lang="ts"`) não vão detectar erros de tipo — mas isso é esperado. O benefício é nos callers `.ts` existentes.

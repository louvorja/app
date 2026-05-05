---
id: 002
title: Migração para TypeScript (faseada: helpers → store → composables → components)
slug: migracao-typescript
category: arquitetura
wave: 4
model: opus
priority: P1
estimate_hours: 80
status: todo
depends_on: [001, 003, 004]
blocks: []
audit_items: [2, 7]
---

# [002] Migração para TypeScript

## Contexto

O projeto é 100% JavaScript. Helpers críticos como `Storage.js` (311 linhas, dual web/Electron), `AppData.js` e `UserData.js` manipulam estado via dot-notation strings (`"modules.media.config.slide"`) sem nenhuma garantia de tipo — um typo silencioso causa bugs que só aparecem em runtime. O `store/mutations.js` tem um `setData` genérico que aceita qualquer string como path, tornando refatorações arriscadas.

Com `<script setup>` (task #001 done), `defineProps<{...}>()` e `defineEmits<{...}>()` dão tipagem de componente sem overhead. Helpers como `Database.js` retornam `any` implícito — o tipo real do JSON carregado é desconhecido para o compilador.

A migração deve ser **incremental e não-bloqueante**: adicionar `tsconfig.json` com `allowJs: true` + `checkJs: false` inicialmente, depois ativar `checkJs` arquivo por arquivo à medida que são tipados. Nunca bloquear o build no processo.

TypeScript é pré-requisito para a task #004 (Storage unificado tipado) e facilita muito a #003 (Pinia com stores tipadas).

## Objetivo

- `tsconfig.json` configurado com `strict: true` e `allowJs: true` para coexistência gradual.
- Helpers críticos (`Storage.ts`, `AppData.ts`, `UserData.ts`, `Database.ts`) totalmente tipados.
- Store Pinia (após #003) com tipos explícitos por store.
- Todos os composables em `src/composables/` tipados.
- Componentes `.vue` com `<script setup lang="ts">` nos módulos críticos (liturgy, media, player).

## Escopo

### Dentro
- `tsconfig.json` + `tsconfig.node.json` (para vite.config).
- Renomear `.js` → `.ts` nos helpers críticos (Storage, AppData, UserData, Database, Broadcast, Media, Alert, Popup).
- Tipagem dos composables em `src/composables/`.
- `defineProps<T>()` e `defineEmits<T>()` nos componentes migrados em #001.
- Tipos para `manifest.json` (já tem JSON Schema de #014 — converter para TS types).

### Fora
- **NÃO** migrar todos os módulos de uma vez — priorizar helpers e composables.
- **NÃO** ativar `strict: true` desde o início — usar `"strict": false` inicialmente, ativar check por check.
- **NÃO** reescrever lógica durante a tipagem — apenas anotar.
- **NÃO** usar `any` como atalho — usar `unknown` + type guards quando necessário.

## Arquivos afetados

**Fase 1 — Infraestrutura TS:**
- `tsconfig.json` (criar)
- `tsconfig.node.json` (criar)
- [vite.config.js](../../vite.config.js) → `vite.config.ts`

**Fase 2 — Helpers críticos:**
- [src/helpers/Storage.js](../../src/helpers/Storage.js) → `.ts`
- [src/helpers/AppData.js](../../src/helpers/AppData.js) → `.ts`
- [src/helpers/UserData.js](../../src/helpers/UserData.js) → `.ts`
- [src/helpers/Database.js](../../src/helpers/Database.js) → `.ts`
- [src/helpers/Broadcast.js](../../src/helpers/Broadcast.js) → `.ts` (tipos BroadcastMessage já definidos em #015)
- [src/helpers/Path.js](../../src/helpers/Path.js) → `.ts`
- [src/helpers/Media.js](../../src/helpers/Media.js) → `.ts` (ou composables de #016)

**Fase 3 — Store (após #003 Pinia):**
- `src/store/` → `src/stores/` (Pinia stores tipadas)

**Fase 4 — Composables:**
- Todos os 10 arquivos em `src/composables/*.js` → `.ts`

**Fase 5 — Componentes críticos:**
- `src/modules/core/liturgy/interface/*.vue` → `lang="ts"`
- `src/components/Player.vue` → `lang="ts"`
- `src/layout/Modules.vue` → `lang="ts"`

## Pré-requisitos

- `#001` done — `<script setup>` em todos os componentes (tipagem de props/emits exige `<script setup lang="ts">`).
- `#003` done — Pinia stores (tipagem com Vuex genérico é mais complexo).
- `#004` done — Storage unificado (interface tipada única).
- Verificar compatibilidade: `vue-tsc` para type-check de `.vue` files.

## Plano de execução

### 002a — Setup TS (sem quebrar nada)
1. Branch `refactor/002a-ts-setup`.
2. Instalar dependências:
   ```bash
   npm install -D typescript vue-tsc @types/node
   ```
3. Criar `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "target": "ESNext",
       "module": "ESNext",
       "moduleResolution": "bundler",
       "strict": false,
       "allowJs": true,
       "checkJs": false,
       "jsx": "preserve",
       "lib": ["ESNext", "DOM"],
       "paths": { "@/*": ["./src/*"] },
       "types": ["node"]
     },
     "include": ["src/**/*.ts", "src/**/*.vue"],
     "exclude": ["node_modules", "dist"]
   }
   ```
4. Adicionar `"type-check": "vue-tsc --noEmit"` no `package.json`.
5. `npm run type-check` deve passar com 0 erros.
6. Commit: `[002a] Add TypeScript infrastructure (allowJs, no-op)`.

### 002b — Helpers críticos
1. Branch `refactor/002b-ts-helpers`.
2. Para cada helper: renomear `.js` → `.ts`, anotar tipos de retorno e parâmetros.
3. Tipar `Storage.ts`: interface `StorageValue`, overloads de `get<T>`.
4. Tipar `AppData.ts`: `get<T>(path: string, ifnull?: T): T`.
5. Tipar `UserData.ts`: interface `UserDataState` com campos conhecidos.
6. Tipar `Database.ts`: `get<T>(key: string): Promise<T>`.
7. `npm run type-check` — corrigir erros.
8. Commit: `[002b] Type helpers: Storage, AppData, UserData, Database`.

### 002c — Composables
1. Branch `refactor/002c-ts-composables`.
2. Renomear todos `src/composables/*.js` → `.ts`.
3. Tipar retornos: `Ref<T>`, `ComputedRef<T>`, interfaces de parâmetros.
4. `useBroadcastListener.ts`: usar tipos de `BroadcastTypes.ts` (#015).
5. Commit: `[002c] Type all composables`.

### 002d — Componentes críticos + strict mode gradual
1. Branch `refactor/002d-ts-components`.
2. Adicionar `lang="ts"` nos componentes do liturgy, Player, Modules.
3. `defineProps<{...}>()` + `defineEmits<{...}>()`.
4. Ativar `strict: true` no tsconfig e corrigir erros.
5. Commit: `[002d] Add lang="ts" to critical components + enable strict`.

## Validação

- [ ] `npm run type-check` passa com 0 erros.
- [ ] `npm run build` passa.
- [ ] `npm run lint` passa.
- [ ] `grep -rn "as any" src/` retorna 0 (exceto casos justificados com comentário).
- [ ] Smoke: abrir liturgy, adicionar item música, cronômetro funciona.
- [ ] Smoke: `$appdata.get("modules.media.config.slide")` tipado corretamente.

## Riscos / atenções

- **`allowJs: true`** é essencial durante a transição — sem ele, os arquivos `.js` não compilam.
- **`vue-tsc`** é separado do `tsc` — necessário para type-check de `.vue`.
- **Dot-notation em AppData/UserData**: tipar com `get<T>(path: DotPath<State>)` é desejável mas complexo — aceitar `string` inicialmente e refinar depois.
- **Electron `preload.cjs`**: arquivos `.cjs` não são cobertos pelo tsconfig — deixar como estão na fase inicial.
- **Ordem das fases**: helpers antes de composables antes de componentes — inversão causa erros em cascata.
- **80h de estimativa**: esta task é a mais longa do projeto — executar em sprints de 1-2 semanas.

## Referências

- Item audit: #2, #7.
- [CLAUDE.md](../../CLAUDE.md) — Stack Vue 3.
- [vue-tsc](https://github.com/johnsoncodehk/volar/tree/master/packages/vue-tsc).
- TypeScript `paths` com Vite: https://vitejs.dev/guide/features#typescript.

---

## Notas pós-execução

### 002a — Setup TS (2026-05-05)

- Instalado `typescript@6.0.3`, `vue-tsc@3.2.8`, `@types/node@25.6.0` como devDependencies.
- Criado `tsconfig.json` com `allowJs: true`, `checkJs: false`, `strict: false`, `moduleResolution: "bundler"`.
- Criado `tsconfig.node.json` para o contexto Node (vite.config.js, scripts).
- Adicionado script `"type-check": "vue-tsc --noEmit"` em `package.json`.
- `npm run type-check` — 0 erros.
- `npm run build` — limpo (4.85s).
- Commit: `[002a] Add TypeScript infrastructure (allowJs, no-op)` em `refactor/003-pinia`.

### 002b — Helpers críticos (2026-05-05)

- Convertidos para `.ts` (rename + tipo): `Storage`, `AppData`, `UserData`, `Database`, `Broadcast`, `BroadcastTypes`, `Path`.
- Criado `src/vite-env.d.ts` com `/// <reference types="vite/client" />` para `import.meta.env`.
- Tipos exportados: `StorageType`, `UserDataState`, `RemoteConfig`, `BroadcastMessage`, `BroadcastTypeValue` + interfaces de payload.
- `get<T>()` genérico em Storage, AppData e UserData com `T | null` como retorno.
- Corrigido JSDoc de `userDataStore.SET_PATH` para refletir assinatura real `{ path, value }`.
- `npm run type-check` — 0 erros; `npm run build` — limpo (4.41s).
- Commit: `[002b] Type helpers: Storage, AppData, UserData, Database, Broadcast, Path`.
- Próximo: 002c — tipar composables em `src/composables/*.js` → `.ts`.

### 002c — Composables (2026-05-05)

- Convertidos para `.ts` todos os 12 composables em `src/composables/`:
  `useAudioPlayback`, `useShell`, `useBroadcastListener`, `useBroadcastSender`,
  `useProjectionState`, `useLyric`, `useAlbum`, `useSlides`, `useMedia`,
  `useModule`, `useDisplays`, `usePlayerState`.
- Interfaces exportadas públicas: `AudioPlayback`, `Slide` (useSlides), `LyricLine`,
  `MusicData`, `LyricOpenParams` (useLyric), `AlbumItem`, `AlbumData` (useAlbum),
  `MediaOpenParams` (useMedia), `ModuleManifest` (useModule), `ElectronDisplay` (useDisplays),
  `PlayerButton`, `MenuMode` (usePlayerState).
- `useBroadcastListener` tipado com `BroadcastMessage` de `BroadcastTypes.ts` (#015).
- `useSlides` importa `AudioPlayback` de `useAudioPlayback` para tipar `bindAudio()`.
- Correções de type-check: callbacks opcionais `(a?: unknown)` em `useMedia` + cast via
  `unknown` para `ComponentPublicInstance` em `useModule`.
- `npm run type-check` — 0 erros; `npm run build` — limpo (4.54s); `npm run test` — 66/66.
- Próximo: 002d — adicionar `lang="ts"` nos componentes críticos + ativar `strict: true`.

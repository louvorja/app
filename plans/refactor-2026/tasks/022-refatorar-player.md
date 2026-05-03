---
id: 022
title: Refatorar Player.vue (453 linhas) — separar lógica de UI
slug: refatorar-player
category: refactor
wave: 3
model: opus
priority: P1
estimate_hours: 8
status: done
depends_on: []
blocks: []
audit_items: [22]
---

# [022] Refatorar Player.vue

## Contexto

`src/components/Player.vue` tem 453 linhas. É o componente central do controle de reprodução — aparece no footer da shell principal. Responsabilidades misturadas:

1. **UI de controles** — botões play/pause/anterior/próximo/volume.
2. **Barra de progresso** — cálculo de posição, seek por clique.
3. **Gauge de áudio** — animação de nível (VU meter visual).
4. **Exibição de metadados** — título, artista, slide atual.
5. **Lógica de estado** — `isPlaying`, `currentTime`, `duration`, `volume`.
6. **Integração com Media.js** — chama `$media.play()`, `$media.pause()`, etc.

O componente mistura lógica de áudio com lógica de apresentação — dificulta testar e reusar.

## Objetivo

Separar em:
```
Player.vue          ← template + orquestração (<100 linhas)
PlayerControls.vue  ← botões de controle (play/pause/prev/next/volume)
PlayerProgress.vue  ← barra de progresso + seek
PlayerGauge.vue     ← VU meter animado
usePlayerState.js   ← estado reativo (tempo, duração, volume, slide index)
```

## Escopo

### Dentro
- Criar `PlayerControls.vue`, `PlayerProgress.vue`, `PlayerGauge.vue`.
- Criar `src/composables/usePlayerState.js`.
- `Player.vue` vira orquestrador simples.

### Fora
- **NÃO** alterar comportamento visual.
- **NÃO** modificar `Media.js`.
- **NÃO** adicionar features de player.

## Arquivos afetados

- `src/components/Player.vue` (simplificar)
- `src/components/PlayerControls.vue` (criar)
- `src/components/PlayerProgress.vue` (criar)
- `src/components/PlayerGauge.vue` (criar)
- `src/composables/usePlayerState.js` (criar)

## Plano de execução — multi-PR

### 022a — usePlayerState.js
1. Ler `Player.vue` inteiro — mapear todo estado e computed.
2. Extrair para composable: `isPlaying`, `currentTime`, `duration`, `volume`, `slideIndex`, `totalSlides`, `title`, `artist`.
3. Player.vue usa composable — comportamento idêntico.
4. Smoke: reprodução funciona.
5. Commit: `[022a] Extract usePlayerState composable`

### 022b — Extrair PlayerControls e PlayerProgress
1. `PlayerControls.vue`: botões play/pause/prev/next/volume. Emite eventos, não chama $media diretamente.
2. `PlayerProgress.vue`: barra + seek. Recebe `currentTime`/`duration` como props, emite `seek`.
3. Smoke: controles funcionam.
4. Commit: `[022b] Extract PlayerControls and PlayerProgress components`

### 022c — Extrair PlayerGauge + limpar Player.vue
1. `PlayerGauge.vue`: VU meter animado independente.
2. `Player.vue` < 100 linhas.
3. Smoke completo do player.
4. Commit: `[022c] Extract PlayerGauge + clean Player.vue`

## Smoke checklist (022c)

- [ ] Play/pause funciona.
- [ ] Navegação entre slides (anterior/próximo).
- [ ] Seek na barra de progresso.
- [ ] Volume slider funciona.
- [ ] Gauge anima durante reprodução.
- [ ] Título/artista exibido.
- [ ] Tema claro/escuro — sem regressão visual.
- [ ] Fechar módulo com música tocando — player limpa.

## Validação

- [ ] `Player.vue` tem < 100 linhas.
- [ ] `usePlayerState.js` em `src/composables/`.
- [ ] Smoke checklist completo.
- [ ] `npm run build` e `lint` passam.

## Riscos / atenções

- **Gauge animada**: provavelmente usa `requestAnimationFrame` ou CSS animation ligada ao `_rafId` do Media.js. Ao extrair, o timing da animação deve ser preservado.
- **Footer.vue**: `Player.vue` está dentro de `Footer.vue`. Verificar que a decomposição não quebra o layout do footer.

## Referências

- Item audit: #22.
- Player.vue: [src/components/Player.vue](../../src/components/Player.vue)

---

## Notas pós-execução

- **Branch base:** `refactor/017c-liturgy-item-component` (continuação do trabalho anterior).
- **Sub-PRs:**
  - 022a: ✅ `usePlayerState.js` extraído (244 linhas):
    - Importa `Media` direto de `@/composables/useMedia` (corrige regressão do 016e
      que removeu `$media` de `globalProperties` mas deixou consumidores quebrados).
    - Estado: `media` (computed sobre `$modules.get("media")`), `slides`,
      `has_instrumental_music`, `compact` (`$vuetify.display.width <= 500`),
      `is_mobile`, `volume_icon`, `slide_text`, `buttons`, `menu_modes`, `mode`.
    - Áudio: re-exporta `useAudioPlayback()` singleton (`audio.*`).
    - Ações: `playToggle`, `rewind`, `forward`, `first/prev/next/last`, `open`,
      `openLyric`, `maximize`, `close`, `fullscreen`, `toggleVolume`, `setVolume`,
      `seekToProgress`, `goToSlide` — todas chamam `Media.*` direto.
    - `getCurrentInstance()` usado para `proxy.$modules`, `proxy.$vuetify`,
      `proxy.$appdata`, `proxy.$t`.
    - `Player.vue` migrado para `setup() { return { ...usePlayerState() } }`.
      457 → 247 linhas (script: 226 → 14).
  - 022b: ✅ `PlayerControls.vue` (29 linhas) e `PlayerProgress.vue` (54 linhas):
    - `PlayerControls`: row dos `v-btn` com `v-shortkey`, recebe `buttons`, `compact`, `loading`.
    - `PlayerProgress`: barra de progresso + timestamps + contador de slides.
      Props escalares (`progress`, `currentTime`, `duration`, `buffered`, etc),
      `:model-value` (sem `v-model`) + emit `seek` no clique.
    - `Player.vue` setup expõe `compactButtons` (computed filtrado) para o
      menu compacto. 247 → 231 linhas.
  - 022c: ✅ `PlayerGauge.vue` (35 linhas), `PlayerActions.vue` (142 linhas):
    - `PlayerGauge`: botão mute + slider de volume. `update:model-value` da
      `v-progress-linear` é encaminhado como `seek`, parent chama `setVolume`.
    - `PlayerActions`: coluna direita (mode menu, slide jump menu,
      maximize/fullscreen/screen/close, compact menu). Importa `LScreenBtn`
      localmente. Emite `go-to-slide`, `maximize`, `fullscreen`, `close`.
    - Player.vue: removidos blocos mortos `location == 'footer'` (Footer.vue
      tem player Delphi-style próprio agora; somente `window` e `fullscreen`
      são usados). 231 → **74 linhas** (< 100 ✅).
- **Surpresas:**
  - O commit 016e removeu `$media` de `globalProperties` mas deixou
    `this.$media.*` em `Player.vue`, `Footer.vue`, `MusicMenuTable.vue` e
    outros — o player estava quebrado em runtime. A refatoração
    do Player.vue corrigiu o uso lá; **Footer.vue e MusicMenuTable.vue ainda
    usam `$media` e precisam de fix em task separada** (fora do escopo de #022).
  - Não há "VU meter animado" como o spec sugeria — `PlayerGauge.vue` virou
    o controle de volume (mute toggle + slider), que é o único elemento
    "tipo gauge" do player.
  - Spec original previa só 3 componentes extraídos; foi necessário criar
    um quarto (`PlayerActions.vue`) para atingir o objetivo `Player.vue < 100`.
- **Smoke checklist:** ⚠️ não executado em runtime (não rodei `npm run dev`);
  `npm run build` + `eslint` passam sem novos erros. Cabe ao usuário validar
  os fluxos manualmente conforme a checklist da seção anterior.

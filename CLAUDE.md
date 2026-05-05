# LouvorJA — Vue.js

Sistema de apresentação de letras de músicas e conteúdo bíblico para uso em cultos e eventos religiosos. Versão web/desktop do sistema original em Delphi (`louvorja-desktop`).

## Stack

- **Vue 3** + Composition API
- **Vuetify 4** (UI + temas claro/escuro) — travado em `~4.0.6` estável; ver `docs/adr/0001-vuetify-versao-estavel.md`
- **Vuex 4** (estado global)
- **Vue Router 5**
- **Vue I18n 11** (PT/ES)
- **Vite 7** (build)
- **vuedraggable** (drag-and-drop)
- **basic-ftp** (download de coletâneas)
- **vue-fullscreen** (projeção fullscreen)
- **vue3-shortkey** (atalhos de teclado)

## Estrutura

```
src/
├── App.vue
├── main.js
├── i18n.js
├── assets/
├── components/          # Componentes reutilizáveis globais
│   ├── Toolbar.vue
│   ├── ToolbarItem.vue
│   ├── Window.vue
│   ├── Player.vue
│   ├── FullscreenPlayer.vue
│   ├── Slide.vue
│   ├── DataTable.vue
│   ├── MusicMenuTable.vue
│   ├── ModuleContainer.vue
│   ├── CustomizationBar.vue
│   ├── CustomizationTools.vue
│   ├── LetterPagination.vue
│   ├── Search.vue
│   ├── Select.vue
│   └── CheckBox.vue
├── helpers/             # Utilitários e serviços
│   ├── ModuleManager.js # Instala e registra módulos
│   ├── Modules.js       # Abre/fecha/minimiza módulos
│   ├── AppData.js       # Estado global (get/set por notação de ponto)
│   ├── UserData.js      # Dados do usuário + persistência em localStorage (com debounce 300ms)
│   ├── Storage.js       # Wrapper de localStorage/sessionStorage
│   ├── Database.js      # Carrega JSONs do banco com cache de sessão
│   ├── Media.js         # Controla reprodução (áudio + slides + broadcast)
│   ├── Broadcast.js     # BroadcastChannel("louvorja") — multi-listener via addEventListener
│   ├── Favorites.js     # Lista de favoritos persistida → this.$favorites
│   ├── History.js       # Histórico de músicas (MAX=50) → this.$history
│   ├── Liturgy.js       # Helper de liturgia (addMusic, clear) → this.$liturgy
│   ├── DateTime.js      # Formatação de tempo HH:MM:SS
│   ├── String.js        # Limpeza e ordenação de strings UTF-8
│   ├── Path.js          # Constrói URLs para banco e arquivos
│   ├── Theme.js         # Gerencia temas visuais
│   ├── Alert.js         # Diálogos e alertas
│   ├── Popup.js         # Gerencia janelas popup
│   ├── Window.js        # Utilitários de janela
│   └── Dev.js           # Logs de desenvolvimento
├── lang/                # Traduções globais (pt.json, es.json)
├── layout/              # Componentes de layout da shell
│   ├── Header.vue
│   ├── Menu.vue
│   ├── Apps.vue
│   ├── AppsRibbon.vue
│   ├── Modules.vue      # Renderizador dinâmico de módulos abertos
│   ├── TrayArea.vue
│   ├── Alert.vue
│   ├── Loading.vue
│   ├── Footer.vue
│   └── SystemBar.vue
├── modules/             # Módulos do sistema (ver ADR 0003)
│   ├── album/
│   ├── bible/
│   ├── clock/           # Relógio digital (12h/24h, fullscreen → /clock)
│   ├── collections/
│   ├── counter/         # Contador simples
│   ├── dev/
│   ├── draw/            # Sorteio de números (fullscreen dialog)
│   ├── favorites/       # Lista de músicas favoritas (drag/drop)
│   ├── history/         # Histórico de músicas abertas
│   ├── hymnal/
│   ├── liturgy/         # Planejador de culto (drag/drop, timer regressivo)
│   ├── lyric/
│   ├── media/
│   ├── message_board/   # Painel de recados dinâmico
│   ├── musics/
│   ├── name_draw/       # Sorteio de nomes (fullscreen dialog)
│   ├── remote_control/
│   ├── slide_editor/    # Editor de slides (autosave sessionStorage)
│   ├── stopwatch/       # Cronômetro (alarme sonoro via Web Audio API)
│   ├── theme/
│   ├── transmission/    # Links para todas as views de projeção/OBS
│   └── update/          # Verificação de versão do banco
├── plugins/             # Plugins Vue (Vuetify, etc.)
├── router/              # Rotas
├── store/               # Vuex store
└── views/
    ├── Main.vue             # Tela principal
    ├── Popup.vue            # Janela popup para módulos
    ├── Projection.vue       # /projection — projeção fullscreen (monitor 2)
    ├── ProjectionReturn.vue # /projection/return — stage display (atual + próximo)
    ├── Obs.vue              # /obs — captura transparente para OBS (slides)
    ├── ObsBible.vue         # /obs/bible — captura OBS de versículos da Bíblia
    ├── Operator.vue         # /operator — grade de slides com navegação por teclado
    └── Clock.vue            # /clock — relógio digital em tela cheia
```

## Convenções de Módulos

Cada módulo em `src/modules/<id>/` segue esta estrutura:

```
<id>/
├── manifest.json        # Metadados do módulo
├── index.js             # Registra o módulo (messages, customization)
├── components/          # Componentes Vue do módulo
│   └── Index.vue        # Componente principal
└── lang/                # Traduções do módulo
    ├── pt.json
    └── es.json
```

**manifest.json mínimo:**
```json
{
  "id": "module_id",
  "name": "Nome",
  "description": "Descrição.",
  "category": "musics|bible|utilities",
  "icon": "mdi-icon-name",
  "dependencies": []
}
```

**Chaves de tradução** ficam em `modules.<id>.<key>` no i18n global.

## Estado Global

O estado fica no Vuex store, acessado via helpers:

```js
import $appdata from "@/helpers/AppData";
import $userdata from "@/helpers/UserData";

// Dados da sessão (voláteis)
$appdata.get("user_data.theme");
$appdata.set("user_data.theme", "dark");

// Dados do usuário (persistidos em localStorage automaticamente)
$userdata.get("theme");
$userdata.set("theme", "dark");
```

**Estrutura de `user_data` no store:**
```js
{
  theme: string,
  language: "pt" | "es",
  layout: "apps" | "ribbon",
  remote: { is_connected, url, token },
  modules: { [moduleId]: { search, filter, ...customization } }
}
```

## Helpers vs Composables

`src/helpers/` contém dois tipos de artefatos — mantenha a distinção ao criar novos arquivos.

**Helper puro** — módulo JS sem APIs Vue (`ref`, `computed`, lifecycle hooks). Exporta funções ou objetos. Importável de qualquer contexto: componentes, composables, Electron main process, testes Node puro.

**Acoplado a Pinia** (`deve-virar-composable`) — helper que acessa o store via `AppData`/`UserData`. Funciona apenas no renderer (onde o Pinia está inicializado). Candidato à migração para composable quando a camada de estado for estabilizada. Cada arquivo tem `@category deve-virar-composable` no JSDoc.

**Composable** — função em `src/composables/` que usa APIs Vue e deve ser chamada apenas dentro de `setup()`. Retorna estado reativo com cleanup automático via `onUnmounted`.

| Arquivo | Tipo | Observação |
|---------|------|------------|
| `helpers/Path.ts` | helper-puro | Seguro no Electron main process |
| `helpers/Strings.js` | helper-puro | |
| `helpers/DateTime.js` | helper-puro | |
| `helpers/Database.ts` | helper-puro | Cache via sessionStorage |
| `helpers/Storage.ts` | helper-puro | Seguro no Electron main process |
| `helpers/Platform.js` | helper-puro | Seguro no Electron main process |
| `helpers/Broadcast.ts` | helper-puro | Baixo nível; use `useBroadcastListener`/`useBroadcastSender` em componentes |
| `helpers/BroadcastTypes.ts` | helper-puro | Só tipos e constantes |
| `helpers/AudioBeep.js` | helper-puro | Web Audio API, sem Vue |
| `helpers/Hotkeys.js` | helper-puro | Event listeners in-window, sem reatividade Vue |
| `helpers/Shortcuts.js` | helper-puro | Atalhos globais OS-level (Electron) |
| `helpers/SljaConverter.js` | helper-puro | Conversão de slides `.slja` |
| `helpers/ModuleTypes.js` | helper-puro | Factory e validação de `manifest.json` |
| `helpers/AppData.ts` | deve-virar-composable | Camada de acesso ao Pinia (dot-notation); candidato a `useAppState` |
| `helpers/UserData.ts` | deve-virar-composable | Preferências persistidas via AppData |
| `helpers/Modules.js` | deve-virar-composable | Runtime open/close de módulos |
| `helpers/Favorites.js` | deve-virar-composable | |
| `helpers/History.js` | deve-virar-composable | |
| `helpers/Liturgy.js` | deve-virar-composable | |
| `helpers/Dev.js` | deve-virar-composable | |
| `helpers/Alert.js` | deve-virar-composable | Já usa `watch()` Vue internamente |
| `helpers/Popup.js` | deve-virar-composable | |
| `helpers/ModuleManager.js` | deve-virar-composable | Boot-time; chamado 1× em `main.js` |
| `helpers/CommandRegistry.js` | deve-virar-composable | Usa `Modules` + `useMedia` composable |

---

## Comunicação Entre Janelas

Janelas popup e janelas de projeção se comunicam via `BroadcastChannel`:

```js
const channel = new BroadcastChannel("louvorja");
channel.postMessage({ type: "slide_change", payload: { ... } });
channel.onmessage = (e) => { ... };
```

A janela de projeção (`/projection`) e stage display (`/projection/return`) recebem estado do player via este canal.

## Banco de Dados

Os dados são arquivos JSON servidos pelo backend configurado em `.env`:

```
VITE_URL_DATABASE=https://...
VITE_URL_FILES=https://...
```

**Padrão de carregamento** (com cache de sessão via `Database.js`):
```js
import $database from "@/helpers/Database";
const musics = await $database.get("pt_musics");
const song   = await $database.get(`music_${id}`);
```

## Rotas

| Rota | Componente | Uso |
|------|-----------|-----|
| `/` | `Main.vue` | Shell principal |
| `/popup` | `Popup.vue` | Módulo em janela popup |
| `/projection` | `Projection.vue` | Tela de projeção fullscreen (monitor 2) com transições CSS |
| `/projection/return` | `ProjectionReturn.vue` | Stage display horizontal (atual + próximo) |
| `/obs` | `Obs.vue` | Captura transparente de slides para OBS Studio |
| `/obs/bible` | `ObsBible.vue` | Captura transparente de versículos para OBS Studio |
| `/operator` | `Operator.vue` | Grade de todos os slides, navegação por teclado (← → Home End) |
| `/clock` | `Clock.vue` | Relógio digital fullscreen (responsive via clamp) |

### Comunicação entre janelas (BroadcastChannel "louvorja")

| Tipo de mensagem | Emitido por | Recebido por |
|---|---|---|
| `slide_change` | `Media.js` timeUpdate/goToSlide | Projection, ProjectionReturn, Obs, Operator |
| `slides_data` | `Media.js` open() | Operator |
| `go_to_slide` | `Operator.vue` | `Media.js` (via listener em getElement) |
| `bible_verse` | `bible/Index.vue` selVerse | ObsBible |
| `message_board` | `message_board/index.vue` | (recepção futura) |

---

## Plano de Migração (Delphi → Vue)

O sistema original em Delphi (`louvorja-desktop`) possui 33 módulos, banco SQLite com 74+ queries, servidor HTTP embarcado, sincronismo de áudio BASS24 e suporte a múltiplos monitores. A migração está organizada em 7 fases.

### FASE 1 — Core de Músicas ✅ concluída
*Prioridade máxima — desbloqueia Fase 2 e 3*

| Feature | Origem Delphi | Status |
|---|---|---|
| Favoritos (lista + reordenação) | `fmFavoritos.pas` + `favoritos.xml` | ✅ módulo `favorites` |
| Histórico de músicas abertas | `cdsBIBLIA_HISTORICO` / uso | ✅ módulo `history` |
| Busca por trecho de letra | `fmBuscaMusica.pas` full-text | ✅ já existia |
| Coletâneas personalizadas | `cdsColETANEAS_PERSO` | ✅ já existia (module `collections`) |
| Bíblia completa | `fmMonitorBiblia` + versões PT/ES | ✅ já existia (module `bible`) |

**Implementação:**
- Módulo `favorites` — store com persistência, lista reordenável via `vuedraggable`
- Histórico — array circular em `UserData`, UI na sidebar
- Bíblia — completar carregamento, busca por livro/capítulo/versículo, múltiplas versões
- Coletâneas personalizadas — CRUD leve com persistência local
- Busca aprimorada — filtro por trecho de letra no `DataTable`

---

### FASE 2 — Liturgia / Gerenciamento de Culto
*Alta prioridade para uso em ambiente de culto*

| Feature | Origem Delphi | Status |
|---|---|---|
| Planejador de culto com itens | `fmLiturgia.pas` | ✅ módulo `liturgy` |
| Tipos de item (música, anotação, site, arquivo) | `fmItensAgendados.pas` | ✅ 6 tipos + drag/drop |
| Salvar/carregar liturgia | Formato `.ja` proprietário | ✅ export/import JSON |
| Cronômetro por item da liturgia | `fmMonitorCronometro.pas` | ✅ integrado no `liturgy` |
| Cronômetro Escola Sabatina | `fmMonitorCronometroCulto.pas` | ✅ módulo `stopwatch` (regressivo) |

**Implementação:**
- Módulo `liturgy` — lista drag/drop de itens, tipos, cores por categoria
- Exportar/importar como JSON (substitui `.ja`)
- Expandir módulo `stopwatch` para vincular com itens da liturgia

---

### FASE 3 — Sistema de Projeção Multi-Janela
*Core do produto*

| Feature | Origem Delphi | Status |
|---|---|---|
| Stage display (slide atual + próximo) | `fmMusicaRetorno.pas` | ✅ `/projection/return` |
| Visão do operador (grade de slides) | `fmMusicaOperador.pas` | ⚠️ roadmap |
| Janela de projeção fullscreen (monitor 2) | `fmMusica.pas` em monitor secundário | ✅ `/projection` |
| Sincronização entre janelas | Eventos internos Delphi | ✅ `BroadcastChannel` em `Broadcast.js` |
| Identificação de monitores | `fmIdentificaMonitores.pas` | ⚠️ roadmap |

**Implementação:**
- Rota `/projection` — `window.open()` para segunda tela, `BroadcastChannel` para sincronização
- Rota `/projection/return` — stage display (slide atual + preview do próximo)
- Módulo `operator` — grade de thumbnails dos slides com navegação por teclado
- UI para configurar qual janela vai para qual monitor (`Window.screen` API)

---

### FASE 4 — Transmissão para OBS/Vmix
*Muito solicitado por usuários de live*

| Feature | Origem Delphi | Status |
|---|---|---|
| Captura do slide atual para OBS | `fmTransmitir.pas` endpoint `/musica?transmissao` | ✅ rota `/obs` |
| Captura do stage display para OBS | endpoint `/musica?retorno` | ✅ rota `/projection/return` |
| Captura do versículo para OBS | endpoint `/biblia?transmissao` | ⚠️ roadmap |

**Implementação:**
- Rota `/obs` — página sem chrome, recebe estado via `BroadcastChannel`, styled para captura
- Rota `/obs/return` — versão stage display
- Rota `/obs/bible` — versículo atual
- Módulo `transmission` — UI para copiar URLs, configurar estilo visual da captura

---

### FASE 5 — Sorteios e Utilitários Avançados

| Feature | Origem Delphi | Status |
|---|---|---|
| Sorteador de números | `fmMonitorSorteio.pas` | ✅ módulo `draw` |
| Sorteador de nomes | `fmMonitorSorteioNomes.pas` | ✅ módulo `name_draw` |
| Painel de recados dinâmico | `fmMonitorPainelDinamico.pas` | ⚠️ roadmap |
| Texto interativo em tela | `fmMonitorTextoInterativo.pas` | ⚠️ roadmap |
| Contador | módulo `counter` | ✅ módulo `counter` |
| Relógio | `fmMonitorRelogio.pas` | ✅ módulo `clock` |
| Doxologia por categorias | `fmMenu` seção doxologia | ⚠️ roadmap |

**Implementação:**
- Módulo `draw` — sorteador de números com animação e exibição fullscreen
- Módulo `name-draw` — sorteador de nomes com lista editável
- Completar módulo `counter`
- Módulo `message-board` — painel de texto livre com formatação

---

### FASE 6 — Editor de Slides
*Feature mais complexa — equivalente a 52K linhas de código Delphi*

| Feature | Origem Delphi | Status |
|---|---|---|
| Criar/editar slides customizados | `fmEditorSlides.pas` | ✅ módulo `slide_editor` |
| Sincronismo de slides com áudio | Marcação de tempo por slide | ⚠️ roadmap |
| Formatação (fontes, cores, alinhamento) | `fmFormatacao.pas` | ✅ cores, tamanho, imagem de fundo |
| Importar/exportar slides | Formato proprietário `.ja` | ✅ export/import JSON |
| Divisão e mesclagem de slides | Operações sobre blocos | ⚠️ roadmap |

**Implementação:**
- Canvas de edição com texto + imagem de fundo
- Toolbar de formatação
- Timeline com marcação de tempo por slide (playback + click)
- Export/import em JSON
- Integração com módulo `media`

---

### FASE 7 — Atualização e Download de Coletâneas

| Feature | Origem Delphi | Status |
|---|---|---|
| Verificação de versão do banco | API `louvorja.com.br/params` | ✅ módulo `update` |
| Download de coletâneas via FTP | `fmAtualiza.pas` | ⚠️ roadmap |
| Verificação de integridade de arquivos | `fmArquivosFalta/Excesso.pas` | ⚠️ roadmap |

**Implementação:**
- Módulo `update` — verifica versão, mostra changelog, botão de atualizar
- Usa `basic-ftp` (já está no `package.json`) para download

---

### Dependências entre fases

```
FASE 1 (core músicas)
    ├── FASE 2 (liturgia)      ← depende de favoritos
    └── FASE 3 (multi-janela)  ← depende de player completo
            └── FASE 4 (OBS)   ← depende de multi-janela
FASE 5 (utilitários)           ← independente
FASE 6 (editor)                ← independente, mais longa
FASE 7 (atualização)           ← independente
```

---

## Comandos

```bash
npm run dev          # Servidor de desenvolvimento web/PWA → http://localhost:5002
npm run host         # Dev exposto na rede local (http://<ip>:5002) — útil para testes mobile
npm run build        # Build de produção (web/PWA)
npm run files        # Servidor de arquivos local → http://localhost:7070 (serve ./files/)
npm run electron:dev   # Desenvolvimento desktop (Electron + Vite) — após D0
npm run electron:build # Build .exe instalável — após D0
```

> **Porta 5002**: deliberada. O Electron usa `http://localhost:5002` como `DEV_URL` em
> `electron/main.cjs`. Alterar a porta exige atualizar `vite.config.js`, `electron/main.cjs`
> e o script `electron:dev` no `package.json` em sincronia.

> **`npm run files`**: servidor HTTP simples (Node.js puro, sem deps) que serve a pasta `./files/`
> na porta 7070 com CORS aberto. Use quando precisar desenvolver offline — aponte `VITE_URL_DATABASE`
> e `VITE_URL_FILES` para `http://localhost:7070/database` e `http://localhost:7070` respectivamente.
> A pasta `./files/` não está no repositório; popule-a com uma cópia local do banco JSON + MP3.
> No Electron (fase D5), será substituído por um servidor Express embarcado na mesma porta 7070.

---

## Migração para Desktop Nativo (Electron)

**Status**: planejada, em implementação a partir de 2026-05-01.

A versão web/PWA atual é a base. A próxima etapa é empacotá-la como **app desktop nativo** (`.exe` instalável no Windows, opcionalmente Mac/Linux) mantendo o PWA web em paralelo.

### Decisões fundamentais

| Item | Escolha | Razão |
|---|---|---|
| Stack desktop | **Electron** (não Tauri) | Reaproveita `basic-ftp`, `archiver`, `fs-extra` já no `package.json`. Sem curva de Rust. |
| Fonte de dados | **JSON pronto do servidor** (não SQLite local) | Mantém `api.louvorja.com.br/json_db/*` como fonte; sem precisar lidar com senha SQLite (`bddbuscacdja`). Cache local em `userData/json_db/` para offline. |
| PWA web em paralelo | **Sim, ambos** | Mesmo código Vue, dois targets (web + desktop). Adapter `Platform.js` detecta `window.louvorjaApi`. |
| Layout | **Manter Ribbon** (evolução do `AppsRibbon.vue`) | Familiaridade com usuários do Delphi. Sem reescrever UI. |
| Servidor LouvorJA atual | **Manter compatibilidade** | API `https://api.louvorja.com.br/params?type=env` com header `Api-Token: 02@v2nFB2Dc` continua sendo a fonte. |

### Arquitetura

```
ELECTRON MAIN (Node.js)
  ├── BrowserWindow factory + screen.getAllDisplays()
  ├── Cache JSON em userData/json_db/ (proxy de api.louvorja.com.br)
  ├── FTP downloader (basic-ftp) com fila + progresso
  ├── HTTP server embarcado (Express, porta 7070)
  ├── globalShortcut, electron-updater
  └── IPC: ipcMain.handle("louvorja:*", ...)
       ↕ contextBridge (preload.cjs)
Vue Renderer (BrowserWindow)
  ├── Main Window  ─┐
  ├── Projection   ─┤── BroadcastChannel("louvorja")
  ├── Operator     ─┤   (já funciona inter-janela no mesmo processo)
  ├── ObsBible     ─┤
  └── ...          ─┘
```

### Roadmap Desktop (D0–D10)

| Fase | Objetivo | Duração | Status |
|---|---|---|---|
| **D0** | Bootstrap Electron — empacota Vue atual em janela nativa, mantém PWA | 1-2 dias | ⏳ próximo |
| **D1** | UserData persistente em `app.getPath("userData")` (substitui localStorage no desktop) | 1 dia | — |
| **D2** | Cache de JSON do banco em `userData/json_db/` via custom protocol `louvorja://` | 1-2 dias | — |
| **D3** | **Download FTP de mídia** ⭐ — handshake com `conn_ftp`, `basic-ftp` baixa MP3/imagens | 3-4 dias | — |
| **D4** | **Multi-monitor real** ⭐ — `BrowserWindow` por monitor, "Identificar Monitores" 5s overlay | 2-3 dias | — |
| **D5** | Servidor HTTP embarcado — Express porta 7070, replica 7 endpoints do `fmTransmitir.pas` | 2 dias | — |
| **D6** | Atalhos globais OS-level — `globalShortcut` + roteamento contextual (substitui `FormKeyUp`) | 1 dia | — |
| **D7** | Player polish — `requestAnimationFrame` para sincronia ±50ms, conversor `.slja` legado | 2-3 dias | — |
| **D8** | Auto-update + distribuição — `electron-updater`, NSIS Win, GitHub releases | 1-2 dias | — |
| **D9** | Polir layout Ribbon — AppMenu hambúrguer, ContextToolbar | 2-3 dias | — |
| **D10** | Funcionalidades restantes (paralelizável) — painel D, texto interativo, vídeos online, editor `.slja` completo | — | — |

**Caminho crítico para MVP** (instalável + baixa músicas + multi-monitor): D0→D1→D2→D3→D4 + D8 ≈ **2-3 semanas**.

### Estrutura Electron (será criada a partir de D0)

```
electron/
├── main.cjs              # Entry point do main process
├── preload.cjs           # contextBridge → window.louvorjaApi
└── main/
    ├── paths.js          # userData, tempDir
    ├── windows.js        # BrowserWindow factory
    ├── userStore.js      # JSON persistente em userData/ (D1)
    ├── jsonCache.js      # Cache de api.louvorja.com.br/json_db (D2)
    ├── protocol.js       # louvorja:// custom protocol (D2)
    ├── displays.js       # screen.getAllDisplays + persist por feature (D4)
    ├── windowFactory.js  # openProjection(monitorId, ...), openOperator (D4)
    ├── identifyMonitors.js # Overlay 5s "Monitor N" (D4)
    ├── shortcuts.js      # globalShortcut (D6)
    ├── updater.js        # electron-updater (D8)
    ├── download/
    │   ├── api.js        # api.louvorja.com.br/params (D3)
    │   ├── handshake.js  # conn_ftp → credenciais voláteis (D3)
    │   ├── ftpQueue.js   # basic-ftp + fila (D3)
    │   └── integrity.js  # comparação por TAMANHO (D3)
    └── httpServer/
        ├── index.js      # Express (D5)
        ├── auth.js       # token + bypass localhost (D5)
        ├── routes.js     # /api/ping, /api/song-slides, etc. (D5)
        └── static.js     # serve userData/server/ (D5)

electron-builder.yml      # Config NSIS Win (D0)
build/installer.nsh       # NSIS custom (D8)
src/helpers/Platform.js   # Adapter web/desktop (D0)
```

### Adapter Platform.js

```js
// src/helpers/Platform.js
export default {
  isDesktop: typeof window !== "undefined" && !!window.louvorjaApi,
  api: typeof window !== "undefined" ? window.louvorjaApi : null,
};
```

Helpers atuais (`Storage`, `Path`, `Popup`, `Window`) detectam `Platform.isDesktop` e delegam para `window.louvorjaApi.*` quando rodando em Electron, ou usam fallback web.

### Compatibilidade com Servidor LouvorJA Delphi

Mantida 100%. Endpoints usados:

- `GET https://api.louvorja.com.br/params?type=env` (header `Api-Token: 02@v2nFB2Dc`) — descobre todos os outros endpoints
- `GET <conn_ftp>?data=<base64>&lang=PT|ES` — handshake para credenciais FTP voláteis
- FTP modo passivo — baixa `config/musicas/<Album>/<faixa>.mp3` etc.
- Cache TTL diário em `userData/configweb.json` (substitui `configweb.ja` do Delphi)

Veja `/Users/juanaleixo/.claude/plans/ticklish-purring-flurry.md` para o plano detalhado com todos os arquivos, riscos e critérios de verificação por fase.

### Spec dos forms Delphi (read-only references)

| Arquivo Delphi | Função | Usado em |
|---|---|---|
| `/Users/juanaleixo/Repo/louvorja-desktop/fmIniciando.pas` | Paths, URL fixa, token, idioma | D0/D2 |
| `/Users/juanaleixo/Repo/louvorja-desktop/fmAtualiza.pas` | Algoritmo FTP completo (Indy → basic-ftp) | D3 |
| `/Users/juanaleixo/Repo/louvorja-desktop/fmTransmitir.pas` | Spec do servidor HTTP (TIdHTTPServer → Express) | D5 |
| `/Users/juanaleixo/Repo/louvorja-desktop/fmEditorSlides.pas:1503-1566` | Parser `.slja` (TZipFile + INI) | D10 |
| `/Users/juanaleixo/Repo/louvorja-desktop/fmMenu.pas:13566-14163` | Escrita `.slja` | D10 |

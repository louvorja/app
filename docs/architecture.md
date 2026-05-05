# 🏗 Arquitetura do Sistema

## 📌 Visão Geral

O LouvorJA é uma SPA baseada em Vue 3 com arquitetura modular dinâmica.

A aplicação é composta por:

- Core (App, Router, Store, Plugins)
- Layout System (Window / Popup)
- Module Loader
- Vuex Global Store
- Sistema de Internacionalização
- Sistema de Plugins

---

## 🧠 Diagrama de Arquitetura

```bash
            ┌─────────────────────┐
            │     main.js         │
            └──────────┬──────────┘
                       │
                  ┌────▼────┐
                  │ App.vue │
                  └────┬────┘
                       │
           ┌───────────┼───────────┐
           │           │           │
      ┌────▼────┐ ┌────▼────┐ ┌────▼────┐
      │ Router  │ │  Store  │ │ Plugins │
      └────┬────┘ └────┬────┘ └────┬────┘
           │           │           │
           └───────────┼───────────┘
                       │
                 ┌─────▼─────┐
                 │  Modules  │
                 └─────┬─────┘
                       │
               ┌───────▼───────┐
               │ UI Components │
               └───────────────┘
```

---

## 🧩 Arquitetura Modular

Cada módulo é isolado e possui:

- Entrada (`index.js`)
- Manifesto (`manifest.json`)
- Interface própria
- Componentes internos
- Traduções independentes

### Fluxo de Carregamento

1. Sistema detecta módulos em `/modules`
2. Lê `manifest.json`
3. Registra módulo
4. Injeta no menu/interface
5. Permite uso via Store e Router

---

## 🔄 Gerenciamento de Estado

Utiliza Vuex para:

- Estado global
- Comunicação entre módulos
- Controle de janelas
- Player e mídia

---

## 🌎 Internacionalização

Sistema baseado em Vue I18n:

- Tradução global em `/src/lang`
- Tradução por módulo em `/src/modules/*/lang`

---

## ⌨️ Atalhos de Teclado

O sistema distingue dois tipos de atalho:

| Tipo | Implementação | Quando funciona |
|------|--------------|----------------|
| **In-window** | `src/helpers/Hotkeys.js` | Apenas quando a janela do app está em foco |
| **Global (OS-level)** | `electron/main/shortcuts.js` | System-wide — mesmo com app minimizado ou em background |

### Tabela de atalhos in-window

Registrados em `src/main.js` via `Hotkeys.register()`. A coluna **Candidato global?** indica
atalhos que podem ser promovidos a `globalShortcut` no Electron (D6) — se isso ocorrer sem
remover o registro in-window, haverá double-fire quando o app estiver em foco.

| Combo | Contexto | Ação | Candidato global? |
|-------|---------|------|:-----------------:|
| `F1` | global | Abre cheatsheet de atalhos | Sim |
| `F5` / `F9` | global | Recarregar dados do módulo ativo | Não |
| `Ctrl+K` / `Cmd+K` | global | Abre Command Palette | Sim |
| `Ctrl+F` | global | Foca campo de busca do módulo ativo | Não |
| `Escape` | global | Fecha módulo ativo | Não |
| `Ctrl+W` | global | Fecha módulo ativo | Não |
| `Ctrl+Shift+F2` | system | Limpa cache do banco e recarrega | Não |
| `Ctrl+Alt+D` | system | Alterna modo desenvolvedor | Não |
| `←` / `→` / `↑` / `↓` | media | Slide anterior / próximo (sem preventDefault) | Não |
| `PageUp` / `PageDown` | media | Slide anterior / próximo | Não |
| `Ctrl+↑` / `Ctrl+↓` | media | Slide anterior / próximo | Não |
| `Ctrl+PageUp` / `Ctrl+PageDown` | media | Slide anterior / próximo | Não |
| `Home` / `End` | media | Primeiro / último slide | Não |
| `Ctrl+←` | media | Música anterior no álbum | **Sim** |
| `Ctrl+→` | media | Próxima música no álbum | **Sim** |
| `Space` / `Pause` | media | Toggle play/pause de áudio | Não |
| `Ctrl+N` | global | Novo item na liturgia | Não |
| `Ctrl+Shift+N` | global | Nova anotação na liturgia | Não |

### Tabela de atalhos globais (Electron)

Registrados em `electron/main/shortcuts.js` via `globalShortcut`. Ativos somente quando o
usuário habilita via módulo Transmissão. Usam exclusivamente Media Keys para evitar conflito
com PowerPoint/OBS/F-keys.

| Accelerator Electron | Ação despachada | Conflito com in-window? |
|---------------------|----------------|:-----------------------:|
| `MediaNextTrack` | `slide:next` | Não |
| `MediaPreviousTrack` | `slide:prev` | Não |
| `MediaPlayPause` | `audio:toggle` | Não |

### Regra para D6

Ao adicionar um `globalShortcut` no Electron que já existe como atalho in-window:

1. Remover o `Hotkeys.register` correspondente **ou** garantir que o handler seja idempotente.
2. Usar `Shortcuts.dispatchAction()` no renderer para roteamento unificado.
3. O `Hotkeys.register` emite `console.warn` automaticamente se o combo estiver na lista
   `GLOBAL_CANDIDATES` de `src/helpers/Hotkeys.js` — use como guia.

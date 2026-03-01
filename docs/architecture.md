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

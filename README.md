# 🎵 LouvorJA

Sistema web do software LouvorJA. Conheça o projeto em <https://louvorja.com.br>.

---

## 📌 Sobre o Projeto

O **LouvorJA** é uma aplicação SPA desenvolvida com Vue 3 e Vuetify 4, estruturada em módulos independentes, permitindo expansão e personalização de funcionalidades como:

- 📖 Bíblia
- 🎶 Hinários
- 🎼 Músicas
- 🎞 Mídia
- 🕒 Relógio
- 🎬 Animações
- 🎨 Temas
- 📚 Coleções

O sistema foi projetado com uma arquitetura modular escalável.

---

## 🚀 Tecnologias Utilizadas

- Vue 3
- Vite
- Vuetify 4
- Vue Router
- Vuex
- Vue I18n
- Vite PWA Plugin
- SASS

---

## 📦 Instalação e Execução

### Pré-requisitos

- [Node.js 18+](https://nodejs.org/pt-br/download)
- [NPM 9+](https://www.npmjs.com/)

### Instalação

#### Clonar o repositório

```bash
git clone https://github.com/louvorja/app
cd app
```

#### Instalar dependências

```bash
npm install
```

### Execução e Compilação

#### Rodar em modo desenvolvimento

```bash
npm run dev
```

#### Build para produção

```bash
npm run build
```

#### Preview da build

```bash
npm run serve
```

***Obs.:** Para executar este comando, é necessário ter rodado a build primeiro.*

---

## 📂 Estrutura de Pastas

```bash
src/
 ├── assets/          # Fontes, estilos e recursos estáticos
 ├── components/      # Componentes reutilizáveis globais
 ├── helpers/         # Utilitários e classes auxiliares
 ├── helpers/         # Arquivos de tradução global
 ├── layout/          # Componentes estruturais (Header, Menu, Footer, etc.)
 ├── modules/         # Módulos da aplicação (músicas, utilitários, bíblia, ...)
 ├── plugins/         # Plugins da aplicação
 ├── router/          # Configuração de rotas
 ├── store/           # Vuex (state, actions, mutations, getters)
 ├── views/           # Views principais (Main para a aplicação, Popup para janela externa)
 ├── i18n.js          # Configuração de internacionalização
 └── main.js          # Entry point da aplicação
 ```

---

## 🧩 Módulos

### Arquitetura Modular

#### Estrutura de Pastas do Módulo

Cada módulo possui:

```bash
module/
 ├── index.js
 ├── manifest.json
 ├── interface/
 ├── components/
 └── lang/
 ```

#### Estrutura Padrão de Módulo

- index.js → Ponto de entrada do módulo
- manifest.json → Metadados
- interface/ → Interface do módulo
- lang/ → Traduções específicas
- components/ → Componentes internos

Isso permite:

- Extensão fácil
- Separação de responsabilidades
- Manutenção simplificada

#### Internacionalização

Dentro de cada módulo, as traduções devem ser colocadas dentro da pasta *src/modules/\*/lang/*

---

## 🧩 Internacionalização

Idiomas suportados:

- 🇧🇷 Português
- 🇪🇸 Espanhol

Arquivos localizados em:

```bash
src/lang/
src/modules/*/lang/
```

---

## 🎨 UI & Layout

- Baseado em Vuetify 4
- Layout com sistema de janelas

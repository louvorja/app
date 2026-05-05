# LouvorJA

Sistema de apresentação de letras de músicas e conteúdo bíblico para uso em cultos e eventos religiosos. Versão web/PWA e desktop (Electron) do software original em Delphi. Visite [louvorja.com.br](https://louvorja.com.br).

---

## Quick start

**Pré-requisitos:** Node.js 18+, npm 9+

```bash
git clone https://github.com/louvorja/app
cd app
npm install
npm run dev        # http://localhost:5002
```

Para expor na rede local (testes mobile): `npm run host`.  
Para build de produção: `npm run build`.

---

## Stack

| Tecnologia | Versão | Nota |
|---|---|---|
| Vue 3 + Composition API | ^3.x | `<script setup>` em todo o projeto |
| Vuetify 4 | ~4.0.6 | Travado — ver [ADR 0001](docs/adr/0001-vuetify-versao-estavel.md) |
| Pinia | ^2.x | Estado global |
| Vue Router | 5.x | Travado — ver [ADR 0002](docs/adr/0002-vue-router-version.md) |
| Vue I18n | ^11.x | PT/ES |
| Vite 7 | ^7.x | Build + dev server (porta 5002) |
| Electron | ^34.x | Target desktop (opcional) |

---

## Documentação

| Documento | Conteúdo |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Convenções, stack, estrutura — lido pelo Claude Code |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Ambiente, comandos, criação de módulos, fluxo de PR |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Camadas, composables vs helpers, BroadcastChannel, estado |
| [docs/design-system.md](docs/design-system.md) | Tokens CSS, paleta, tipografia, espaçamento, utilitárias |
| [docs/adr/](docs/adr/) | Decisões arquiteturais formalizadas (Vuetify, Vue Router, etc.) |

---

## Licença

Distribuído sob a licença MIT.

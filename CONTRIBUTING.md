# Guia de Contribuicao — LouvorJA

Obrigado por querer contribuir! Este documento centraliza tudo o que voce precisa para comecar.

---

## Primeiros Passos

### 1. Fork & Clone

```bash
git clone https://github.com/SEU-USUARIO/app
cd app
```

### 2. Instalacao

```bash
npm install
npm run dev
```

### 3. Branch de Trabalho

```bash
git checkout -b feat/nome-da-feature
# ou
git checkout -b fix/nome-do-bug
```

---

## Arquitetura Modular

O projeto usa **modulos independentes** em `src/modules/`. Cada modulo tem:

```
module/
 ├── index.js          # Ponto de entrada
 ├── manifest.json     # Metadados (nome, versao, dependencias)
 ├── interface/        # API publica do modulo
 ├── components/       # Componentes Vue internos
 └── lang/             # Traducoes (pt-BR, es)
```

### Criando um Modulo Novo

1. Copie `src/modules/template` (ou um existente como `bible`)
2. Atualize `manifest.json`
3. Registre no `src/store/modules/index.js`
4. Adicione rotas em `src/router/modules/`

---

## Checklist de PR

### Codigo

- [ ] Lint passa (`npm run lint`)
- [ ] Build production OK (`npm run build`)
- [ ] Testes passam (`npm run test` -- se existir)
- [ ] Sem `console.log` / `debugger` no codigo final

### Commits

- [ ] Mensagens claras (`feat: adiciona modulo X`, `fix: corrige bug Y`)
- [ ] Um commit por mudanca logica (rebase se necessario)

### Documentacao

- [ ] `README.md` atualizado se mudar instalacao/uso
- [ ] Comentarios JSDoc em funcoes publicas novas
- [ ] Traducoes pt-BR + es para strings user-facing

### Arquitetura

- [ ] Modulo segue estrutura padrao (`index.js`, `manifest.json`, `interface/`, `lang/`)
- [ ] Nao quebra modulos existentes
- [ ] Estado Vuex imutavel (sem mutacao direta em getters)

---

## Reportando Bugs

Use o template:

```markdown
**Descricao**: O que acontece vs. o esperado
**Passos**: 1. Va em... 2. Clique em... 3. Veja o erro
**Ambiente**: OS, Node, Browser, Versao do app
**Logs**: Console / Network / Screenshot
```

---

## Sugerindo Features

Abra uma **Issue** com label `enhancement` descrevendo:

- Problema que resolve
- Usuarios impactados
- Alternativas consideradas
- Mockup / wireframe (se UI)

---

## Seguranca

**NUNCA** abra issue publica para vulns. Reporte em private para mantenedores.

---

## Labels Uteis

| Label | Uso |
|-------|-----|
| `bug` | Comportamento incorreto |
| `enhancement` | Nova feature / melhoria |
| `security` | Vulnerabilidade (privado) |
| `perf` | Otimizacao de performance |
| `docs` | Documentacao |
| `good first issue` | Iniciante-friendly |
| `help wanted` | Precisa de contribuidor |

---

## Duvidas?

- Abra `Discussion` no GitHub
- Marque `@louvorja/maintainers` no PR

---

> **Dica**: Comece por issues com label `good first issue` -- sao pontos de entrada ideais.

# Configuração do Ambiente de Desenvolvimento

## Visão Geral da Arquitetura

O LouvorJA é composto por três peças independentes:

```
┌─────────────────────────────────────────────────────────┐
│  Frontend  (este repo)                                  │
│  Vue 3 + Vite  →  localhost:5002 (npm run dev)          │
└───────────────────────┬─────────────────────────────────┘
                        │  HTTP fetch + Api-Token header
          ┌─────────────▼─────────────┐
          │       Servidor de dados   │
          │  JSON (banco) + arquivos  │
          │  de mídia (imagens/áudio) │
          └───────────────────────────┘
```

O frontend **não tem banco de dados embutido**. Todos os dados (letras, hinos, versículos, álbuns) vêm de um servidor HTTP externo, configurado via variáveis de ambiente.

---

## Pré-requisitos

- Node.js 18+
- npm 9+

---

## Configuração do `.env`

O arquivo `env` na raiz do projeto é um **template documentado**. Copie-o para `.env` e preencha os valores:

```bash
cp env .env
```

> O `.env` está no `.gitignore` — nunca commite o arquivo com valores reais.

Variáveis obrigatórias:

| Variável | Descrição |
|---|---|
| `VITE_URL_DATABASE` | URL base dos arquivos JSON do banco |
| `VITE_URL_FILES` | URL base dos arquivos de mídia (imagens, áudios) |
| `VITE_API_TOKEN` | Token de autenticação enviado no header `Api-Token` |
| `VITE_APP_MODE` | `development` ou `production` (controla logs, debug e detalhe dos erros) |

---

## Opções para Rodar Localmente

### Opção 1 — API Online (mais simples)

Aponte o `.env` para o servidor de produção. Não requer nenhuma dependência local além do frontend.

```env
VITE_APP_MODE=development
VITE_URL_DATABASE=https://api.louvorja.com.br/json_db
VITE_URL_FILES=https://api.louvorja.com.br/file
VITE_API_TOKEN=<token obtido com o administrador>
```

Depois é só:

```bash
npm install
npm run dev
```

---

### Opção 2 — API Local (recomendado para quem altera o banco)

Clone e execute o repositório da API separado. Ele expõe as mesmas rotas do servidor de produção.

```bash
# Em outro diretório, clone o repo da API
# (endereço obtido com os mantenedores do projeto)
git clone <url-repo-api>
cd <repo-api>
# siga as instruções de setup do repo da API
# por padrão sobe na porta 8000
```

No `.env` deste projeto:

```env
VITE_APP_MODE=development
VITE_URL_DATABASE=http://localhost:8000/json_db
VITE_URL_FILES=http://localhost:8000/file
VITE_API_TOKEN=<token>
```

---

### Opção 3 — Servidor de Arquivos Local (offline)

Usa o servidor HTTP estático incluso no projeto (`node/server.js`). Requer a pasta `files/` populada com os JSONs e mídias — obtidos com os mantenedores do projeto (não estão no git).

```env
VITE_APP_MODE=development
VITE_URL_DATABASE=http://localhost:7070/database
VITE_URL_FILES=http://localhost:7070
VITE_API_TOKEN=<token>
```

Execute em dois terminais separados:

```bash
# Terminal 1 — servidor de dados
npm run files

# Terminal 2 — frontend
npm run dev
```

**Estrutura esperada em `files/`:**

```
files/
├── database/
│   ├── config.json
│   ├── pt_categories.json
│   ├── pt_musics.json
│   ├── pt_hymnal.json
│   ├── pt_hymnal_1996.json
│   ├── pt_bible_book.json
│   ├── pt_bible_version.json
│   ├── bible_{id_version}_{id_livro}_{capitulo}.json
│   ├── music_{id}.json
│   └── album_{id}.json
└── <arquivos de mídia referenciados pelos JSONs>
```

> O servidor adiciona `.json` automaticamente para rotas em `/database/*`.

---

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o frontend em modo desenvolvimento (porta 5002) |
| `npm run files` | Inicia o servidor de arquivos estáticos (porta 7070) |
| `npm run build` | Gera o build de produção |
| `npm run serve` | Preview do build (requer `npm run build` antes) |
| `npm run host` | Frontend acessível na rede local (`--host`) |
| `npm run lint` | Verifica o código com ESLint |

---

## Problemas Comuns

### "Arquivo de dados não encontrado!" ao abrir o app

Com `VITE_APP_MODE=development`, o alerta exibe detalhes extras: qual arquivo falhou, a URL completa da requisição e um checklist de verificação. Exemplo:

```
[DEV] Falha ao carregar: pt_bible_book
URL: http://localhost:7070/database/pt_bible_book
Verifique:
• O arquivo .env existe e tem VITE_URL_DATABASE definido
• O servidor de dados está rodando (npm run files ou API local)
• O arquivo pt_bible_book.json existe no servidor
```

Causas em ordem de probabilidade:

1. **`.env` não encontrado** — Copie o template: `cp env .env`
2. **Vite não foi reiniciado após criar/editar o `.env`** — pare o `npm run dev` (Ctrl+C) e reinicie
3. **`VITE_API_TOKEN` vazio** — preencha com o token obtido com o administrador
4. **Servidor de dados não está rodando** — execute `npm run files` (opção 3) ou suba a API local (opção 2)
5. **Arquivo específico ausente no servidor local** — a URL exibida no alerta (modo dev) indica exatamente qual arquivo está faltando
6. **Porta 7070 ocupada** — verifique com `netstat -ano | findstr :7070`. O AnyDesk usa essa porta por padrão; encerre-o ou mude a porta do servidor

### Porta 7070 em uso (Windows)

O AnyDesk usa a porta 7070. Para identificar o processo:

```powershell
netstat -ano | findstr ":7070"
# anote o PID e verifique:
Get-Process -Id <PID>
```

Se for o AnyDesk e você não precisar dele no momento, encerre-o. Alternativamente, mude a porta em `node/server.js` e no `.env`.

### O app não atualiza os dados após mudar o banco

Os JSONs são cacheados no `sessionStorage` com chave `db:<nome>`. Para forçar recarregamento, abra o DevTools → Application → Session Storage e limpe, ou feche e reabra a aba.

---

## Fluxo de dados detalhado

```
npm run dev (porta 5002)
     │
     ├─ monta componentes
     ├─ chama $database.get("config")
     │       │
     │       ├─ verifica sessionStorage (cache "db:config")
     │       │   └─ se encontrado: retorna cache
     │       │
     │       └─ GET {VITE_URL_DATABASE}/config?{data}
     │               header: Api-Token: {VITE_API_TOKEN}
     │               │
     │               └─ resposta JSON → salva no cache → retorna
     │
     └─ arquivos de mídia (imagens, áudio)
             └─ {VITE_URL_FILES}/{caminho}
```

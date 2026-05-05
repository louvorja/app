# Variáveis de Ambiente — LouvorJA

Todas as variáveis prefixadas com `VITE_` são expostas ao código Vue via `import.meta.env.*`
(exceto `VITE_BASE_URL`, lida pelo Vite em `vite.config.js` antes do build).

Copie `.env.example` para `.env` e preencha os valores reais.
**Nunca commite `.env` no git.**

---

## Variáveis obrigatórias

### `VITE_URL_DATABASE`

| Campo       | Valor                                    |
|-------------|------------------------------------------|
| Tipo        | URL (string)                             |
| Exemplo     | `https://api.louvorja.com.br/json_db`    |
| Offline     | `http://localhost:7070/database`         |
| Usado em    | `helpers/Path.ts`, `helpers/Database.ts`, `main.js`, `modules/update` |

URL base do banco de dados JSON. Todas as chamadas de `$database.get(key)` resolvem para
`{VITE_URL_DATABASE}/{key}`. Se ausente, nenhum dado de música/bíblia/coletânea carrega.

---

### `VITE_URL_FILES`

| Campo       | Valor                                    |
|-------------|------------------------------------------|
| Tipo        | URL (string)                             |
| Exemplo     | `https://api.louvorja.com.br/file`       |
| Offline     | `http://localhost:7070`                  |
| Usado em    | `helpers/Path.ts`, `main.js`             |

URL base para arquivos de mídia (MP3, imagens de slide). Usada por `Path.file(path)`.
Se ausente, a reprodução de áudio e carregamento de imagens de fundo falham silenciosamente.

---

### `VITE_API_TOKEN`

| Campo       | Valor                                    |
|-------------|------------------------------------------|
| Tipo        | string (token opaco)                     |
| Exemplo     | *(obtido com o administrador)*           |
| Usado em    | `helpers/Database.ts`, `main.js`, `modules/update` |

Token enviado como header `Api-Token` em todas as requisições ao servidor louvorja.
Se ausente, as requisições ao `api.louvorja.com.br` retornam 401 e o app não carrega dados.
Em desenvolvimento com servidor local (`npm run files`), pode ser deixado vazio.

---

## Variáveis opcionais

### `VITE_APP_MODE`

| Campo       | Valor                                          |
|-------------|------------------------------------------------|
| Tipo        | `"development"` \| `"production"`              |
| Padrão      | `"production"` (se não definida)               |
| Usado em    | `src/views/Shell.vue`                          |

Controla exibição de ferramentas de debug na Shell (atalho `Ctrl+Alt+D`).
Definir como `"development"` habilita o menu de depuração. Em produção, o menu é ocultado
independente do `mode` do Vite.

---

### `VITE_APP_VERSION`

| Campo       | Valor                                          |
|-------------|------------------------------------------------|
| Tipo        | string semver                                  |
| Exemplo     | `1.27.0`                                       |
| Padrão      | `"—"` (fallback no display)                   |
| Usado em    | `modules/update/components/Index.vue`          |

Versão exibida no módulo **Atualização**. Normalmente injetada pelo CI:

```bash
VITE_APP_VERSION=$npm_package_version npm run build
```

Se não definida, o módulo exibe `"—"` no lugar da versão atual.

---

### `VITE_DB_VERSION`

| Campo       | Valor                                          |
|-------------|------------------------------------------------|
| Tipo        | string (ex: data `20260101` ou hash curto)     |
| Exemplo     | `20260501`                                     |
| Padrão      | `""` (cache só expira por TTL)                 |
| Usado em    | `helpers/Database.ts`                          |

Chave de versionamento do banco de dados. `Database.ts` usa essa string para compor a chave
do sessionStorage. Alterar o valor descarta todos os JSONs em cache e força nova busca
do servidor — útil quando o banco é atualizado sem reiniciar o navegador.

Quando não definida (ou vazia), o cache expira apenas pelo TTL de 1 hora definido em `Database.ts`.

---

### `VITE_BASE_URL`

| Campo       | Valor                                          |
|-------------|------------------------------------------------|
| Tipo        | string (path com `/` final)                    |
| Exemplo     | `/app/`                                        |
| Padrão      | `"/"` (raiz do domínio)                        |
| Usado em    | `vite.config.js` (via `process.env`)           |

Define o `base` do Vite e o `start_url` do manifesto PWA. Necessário apenas quando o app
é servido em subpath (ex: `https://meusite.com/app/`). Lida antes do build pelo Vite
via `process.env`, não exposta ao código Vue via `import.meta.env`.

---

### `VITE_TARGET`

| Campo       | Valor                                          |
|-------------|------------------------------------------------|
| Tipo        | `"desktop"` \| `""` (vazio = web/PWA)          |
| Exemplo     | `VITE_TARGET=desktop npm run build`            |
| Padrão      | `""` (build web/PWA)                           |
| Usado em    | `vite.config.js` (fase Electron D0 — pendente) |

Alvo do build. Quando `"desktop"`, desativa o plugin PWA/Service Worker e configura `base: "./"`.
**Ainda não implementado no `vite.config.js`** — reservado para a fase D0 do roadmap Electron.
O script `npm run electron:build` injetará essa variável automaticamente.

---

## Resumo

| Variável          | Obrigatória | Fallback               | Contexto           |
|-------------------|-------------|------------------------|--------------------|
| `VITE_URL_DATABASE` | Sim       | —                      | `import.meta.env`  |
| `VITE_URL_FILES`    | Sim       | —                      | `import.meta.env`  |
| `VITE_API_TOKEN`    | Sim (prod)| *(sem auth em dev local)* | `import.meta.env` |
| `VITE_APP_MODE`     | Não       | `"production"`         | `import.meta.env`  |
| `VITE_APP_VERSION`  | Não       | `"—"`                  | `import.meta.env`  |
| `VITE_DB_VERSION`   | Não       | `""` (TTL only)        | `import.meta.env`  |
| `VITE_BASE_URL`     | Não       | `"/"`                  | `process.env`      |
| `VITE_TARGET`       | Não       | `""` (web/PWA)         | `process.env`      |

> `PERCY_TOKEN` (em `.env.example`) não é variável Vite — é usada exclusivamente pelo
> CLI do Percy durante testes de regressão visual (`npm run test:visual`).

---
id: 093
title: Validar Electron build em CI (matriz win/mac/linux)
slug: electron-ci
category: electron
wave: 4
model: opus
priority: P2
estimate_hours: 4
status: done
depends_on: [088]
blocks: []
audit_items: [93]
---

# [093] Electron build em CI

## Contexto

O repositório tem `.github/workflows/release.yml.template` com todo o conteúdo comentado. O workflow está estruturado para build matrix (win/mac) com `electron-builder` em tag push, mas nunca foi ativado. Não há CI rodando para o build web (`npm run build`) nem para testes.

Consequência: é possível fazer merge de um PR que quebra o build do Electron e só descobrir quando alguém roda `npm run electron:build` localmente. Com o roadmap D0-D10 avançando, builds quebrados de Electron virarão bloqueadores.

O arquivo template tem a estrutura correta — precisa apenas ser descomentado, ajustado para os paths reais e ativado. O build de testes unitários (Vitest, #088) deve ser adicionado como step antes do build Electron.

`electron-builder.yml` existe no repositório com a config de build. `electron/main.cjs` e `electron/preload.cjs` existem. O que falta é o workflow de CI.

## Objetivo

- `.github/workflows/release.yml` ativo (não mais `.template`).
- CI roda em push para `main` e em tags `v*.*.*`.
- Steps: `npm ci` → `npm test` → `npm run build` (web) → `npm run electron:build` (matriz win/mac).
- Artifacts de instalador `.exe`/`.dmg` salvos por 7 dias nos releases.

## Escopo

### Dentro
- Ativar `.github/workflows/release.yml.template` → `release.yml`.
- Adicionar step de testes Vitest antes do build.
- Matrix: `windows-latest` + `macos-latest`.
- Artifacts: instaladores uploadados como release assets em tag push.
- Build web simples (`npm run build`) em push para `main` (sem artifacts).

### Fora
- **NÃO** configurar `linux` na matrix — foco em plataformas de distribuição real.
- **NÃO** configurar auto-update (isso é D8 do roadmap desktop).
- **NÃO** assinar código (code signing) — deixar para D8.
- **NÃO** rodar E2E (#089) no CI nesta task — apenas unit tests.

## Arquivos afetados

- `.github/workflows/release.yml.template` → renomear e ativar como `.github/workflows/release.yml`
- `.github/workflows/ci.yml` (criar) — CI para PRs e pushes para main (sem electron build)
- `package.json` — verificar que script `electron:build` está correto

## Pré-requisitos

- `#088` done — `npm test` funcional.
- `electron/main.cjs` e `electron/preload.cjs` existem.
- `electron-builder.yml` configurado corretamente.
- Repositório no GitHub com Actions habilitado.
- Verificar se `GITHUB_TOKEN` padrão é suficiente ou se é necessário `GH_TOKEN` para upload de release.

## Plano de execução

1. Branch `chore/093-electron-ci`.

2. Ler `.github/workflows/release.yml.template`:
   ```bash
   cat .github/workflows/release.yml.template
   ```

3. Criar `.github/workflows/ci.yml` (CI para PRs/pushes, sem Electron build):
   ```yaml
   name: CI
   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]
   jobs:
     test-and-build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: '20', cache: 'npm' }
         - run: npm ci
         - run: npm test
         - run: npm run build
   ```

4. Descomenthar e ajustar `release.yml.template`:
   - Remover todos os comentários `#`.
   - Ajustar `node-version` para `'20'`.
   - Adicionar step `npm test` antes do build.
   - Garantir que `electron:build` usa `GH_TOKEN` para upload de assets.
   - Verificar `electron-builder.yml` para `appId`, `productName`, output dir.

5. Renomear para `release.yml`:
   ```bash
   mv .github/workflows/release.yml.template .github/workflows/release.yml
   ```

6. Conteúdo final do `release.yml` (estrutura):
   ```yaml
   name: Release
   on:
     push:
       tags: ['v*.*.*']
   jobs:
     build:
       strategy:
         matrix:
           os: [windows-latest, macos-latest]
       runs-on: ${{ matrix.os }}
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: '20', cache: 'npm' }
         - run: npm ci
         - run: npm test
         - run: npm run build
         - run: npm run electron:build
           env:
             GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
         - uses: actions/upload-artifact@v4
           with:
             name: installer-${{ matrix.os }}
             path: dist/*.exe
             retention-days: 7
   ```

7. Fazer push para um branch de teste e verificar que o CI roda corretamente (não é necessário criar uma tag real — pode usar `workflow_dispatch` para testar).

8. Adicionar `workflow_dispatch` ao `release.yml` para testes manuais.

9. Commit: `[093] Activate CI workflow (tests + web build + electron matrix)`.

## Validação

- [ ] `.github/workflows/ci.yml` roda em push para main — `npm test` + `npm run build` passam.
- [ ] `.github/workflows/release.yml` ativo (não mais `.template`).
- [ ] Matrix win/mac configurada corretamente.
- [ ] `npm test` é step obrigatório antes do electron build.
- [ ] Artifact de instalador salvo em caso de build bem-sucedido.

## Riscos / atenções

- **Code signing**: sem signing, `electron-builder` pode falhar no macOS (Gatekeeper) ou Windows (SmartScreen). Adicionar `--publish never` para builds CI que não são release oficial.
- **Tamanho do instalador**: `.exe` pode ser 100+ MB — `upload-artifact` tem limite de 2GB, mas downloads de CI são lentos. Considerar `retention-days: 3` para não acumular.
- **`GITHUB_TOKEN` vs `GH_TOKEN`**: `electron-builder` usa `GH_TOKEN` por convenção. O `GITHUB_TOKEN` padrão das Actions tem permissão de write em releases — verificar se é suficiente ou se é necessário criar PAT.
- **Windows Runner**: pode ter problemas com paths longos. Adicionar `git config --global core.longpaths true` se necessário.
- **`npm run electron:build`**: verificar que este script existe em `package.json` e produz o artefato esperado.

## Referências

- Item audit: #93.
- [.github/workflows/release.yml.template](../../.github/workflows/release.yml.template) — template existente.
- [electron-builder docs](https://www.electron.build/).
- [GitHub Actions matrix](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs).
- Roadmap D8 — auto-update + distribuição.

---

## Notas pós-execução

- `.github/workflows/ci.yml` criado: ubuntu-latest, Node 20, `npm ci` → `npm test` → `npm run build`. Roda em push para `main` e PRs.
- `.github/workflows/release.yml` criado a partir do `.template` (template removido): matrix win/mac, `--publish never` + `upload-artifact@v4` para artefatos locais (publicação no GitHub Releases fica para D8).
- No step Windows: `git config core.longpaths true` adicionado preventivamente (paths longos no NSIS).
- No step macOS: `CSC_IDENTITY_AUTO_DISCOVERY: false` para evitar falha por ausência de certificado de assinatura (Gatekeeper); sem signing é esperado em CI sem D8.
- Diretório de saída do `electron-builder.yml` é `dist_electron/` — paths dos artifacts corrigidos conforme config real.
- `.template` original mantido no repo para referência histórica (não removido — apenas ignorado pelo Actions).

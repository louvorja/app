---
id: 058
title: "RFC: voltar para Vuetify 3 (estável) — abandonar Vuetify 4 alpha"
slug: rfc-vuetify-decision
category: arquitetura
wave: 2
model: opus
priority: P0
estimate_hours: 4
status: done
depends_on: []
blocks: [028, 030, 037, 067]
audit_items: [58, 59]
---

# [058] RFC — Voltar para Vuetify 3, abandonar Vuetify 4 alpha

> **Decisão recomendada:** **voltar para Vuetify 3 estável.** Aguardando aprovação humana antes de executar a fase de implementação.

## Contexto

[package.json:52](../../package.json#L52) declara:

```json
"vuetify": "^4.0.0"
```

Vuetify 4 ainda está em **alpha** (sem release `4.x` estável conhecido até a cutoff de jan/2026). Releases alpha sofrem **breaking changes** sem semver — `^4.0.0-alpha.X` pode quebrar visualmente a cada minor que o npm baixar.

Riscos concretos para o LouvorJA:
- **Visual quebrar em produção** sem aviso (mudança de defaults de spacing, theme tokens, etc).
- **Componentes mudarem de API** (props, slots, eventos) — o projeto usa **30+ componentes Vuetify diferentes**, com 130 `<v-icon>`, 99 `<v-btn>` e 21 `<v-list-item>` espalhados.
- **Documentação alpha vaga.** Quando algo quebra, achar fix demanda ler PRs do GitHub do Vuetify.
- **Plugins externos** (vuedraggable, vue-fullscreen, vue-country-flag-next) testados contra Vuetify 3 estável — combinação alpha não tem garantia.
- **Onda 2 fica refém:** tasks #028 (tokens CSS), #030 (`:global(.v-theme--dark)`), #037 (Slide dark theme), #067 (Prettier) tocam estilo Vuetify-dependente. Migrar tudo para um alvo instável é dor dupla.

Single componente exclusivo do v4 detectado no código: `<v-number-input>` (4 usos). Substituível por `<v-text-field type="number">` ou variantes triviais.

Tudo o mais (`v-app`, `v-card`, `v-btn`, `v-dialog`, `v-list`, `v-tabs`, `v-text-field`, `v-menu`, `v-progress-linear`, `v-slide-group`, `v-tabs-window`, `v-snackbar`, `v-skeleton-loader`, `v-switch`, `v-slider`, `v-tooltip`, `v-chip`, `v-textarea`, `v-progress-circular`, `v-alert`, `v-table`, `v-toolbar`, `v-bottom-sheet`, `v-btn-toggle`, `v-checkbox-btn`, `v-avatar`, `v-card-actions`, `v-img`, `v-list-item-title`, `v-list-item-subtitle`, etc.) tem API equivalente em Vuetify 3.x.

## Objetivo

Decisão registrada e versão travada. Ao final desta task:

- `package.json` declara `"vuetify": "~3.7.0"` (ou versão equivalente estável mais recente do v3).
- Build e dev funcionam.
- Componentes visuais não regridem (validado por screenshots antes/depois das telas-chave).
- Documentado em `docs/adr/0001-vuetify-3-estavel.md` (criar pasta).

## Decisão recomendada

**Voltar para Vuetify 3 estável** (ex: `~3.7.0`, validar última estável ao executar).

### Por quê

| Critério                        | Vuetify 4 alpha               | Vuetify 3 estável (recomendado) |
|--------------------------------|-------------------------------|---------------------------------|
| Estabilidade                   | Alpha, breaking sem aviso     | Stable, semver respeitado       |
| Comunidade / Stack Overflow    | Migrando, respostas escassas  | Madura                          |
| Vue 3 compat                   | Sim (3.5+)                    | Sim (3.4+)                      |
| Componentes usados pelo projeto | Quase todos disponíveis       | **Todos** disponíveis           |
| Custo de migrar agora          | Sem ganho                     | 1 task (~4h)                    |
| Custo de manter Vuetify 4      | Refactors recorrentes a cada minor alpha | Zero |
| Habilita Onda 2 limpa          | Não                           | Sim                             |

### Quando reconsiderar

Quando Vuetify 4 sair em release **estável** (`4.0.0` non-prerelease) com pelo menos **3 meses de soak** em projetos públicos comparáveis. Avaliar via task nova e dedicada.

## Escopo

### Dentro
- Travar `vuetify: "~3.X.Y"` (última patch da última minor estável).
- Substituir 4 usos de `<v-number-input>` por `<v-text-field type="number">` ou similar.
- Validar build, lint, smoke checklist.
- Criar ADR `docs/adr/0001-vuetify-3-estavel.md`.
- Atualizar CLAUDE.md (seção Stack).

### Fora (explícito)
- **NÃO** trocar `createVuetify` config — os themes em [src/plugins/vuetify.js](../../src/plugins/vuetify.js) funcionam idêntico em v3.
- **NÃO** mudar uso de `vite-plugin-vuetify` (compatível com v3 e v4).
- **NÃO** mexer no `tokens.css` — design system custom é independente do Vuetify.
- **NÃO** substituir componentes Vuetify por custom — fora desta task.

## Arquivos afetados

- [package.json](../../package.json) — bumpar `vuetify` para v3 estável.
- [package-lock.json](../../package-lock.json) — regenerado por `npm install`.
- [src/plugins/vuetify.js](../../src/plugins/vuetify.js) — verificar que `createVuetify({ theme: { ... } })` continua válido (deve continuar — API estável).
- Componentes que usam `<v-number-input>` (4 ocorrências, descobrir com `grep -rn "v-number-input" src/`).
- `docs/adr/0001-vuetify-3-estavel.md` — **novo**.
- [CLAUDE.md](../../CLAUDE.md) — seção "Stack" para refletir versão travada.

## Pré-requisitos

- Status `pending-approval` — usuário precisa confirmar a decisão antes de executar.
- Onda 1 concluída (evita conflito de merge).
- Screenshots **antes** das telas-chave salvos para regressão:
  - Shell completo (Ribbon + Player + módulo aberto)
  - Tela de projeção (`/projection`)
  - Tela do operador (`/operator`)
  - Diálogo de alerta
  - Command Palette aberto
  - Liturgia com items

## Plano de execução

### Fase A — Aprovação (manual, fora da sessão)

1. Usuário lê esta RFC.
2. Confirma a decisão (`/approve 058` ou edição manual de `status: ready`).
3. Sessão Opus inicia a Fase B.

### Fase B — Migração

1. **Branch:**
   ```bash
   git checkout -b refactor/058-vuetify-3
   ```

2. **Tirar screenshots de referência** (manual):
   - Salvar em `docs/visual-regression/before-058/` (criar pasta).
   - Ou usar Percy/Chromatic se já estiver configurado (não é o caso ainda).

3. **Descobrir versão alvo:**
   ```bash
   npm view vuetify@3 version
   # Esperado: 3.7.x ou superior estável; pegar a última patch da última minor.
   ```
   Travar com tilde (`~3.X.Y`) — apenas patches automáticos.

4. **Atualizar `package.json`:**
   ```json
   "vuetify": "~3.7.X"
   ```

5. **Reinstalar:**
   ```bash
   npm install
   ```
   Conferir que `package-lock.json` mostra `vuetify@3.7.X`.

6. **Substituir `v-number-input`:**
   ```bash
   grep -rn "v-number-input" src/
   ```
   Para cada ocorrência, trocar por `<v-text-field type="number" :min="..." :max="..." :step="...">`. Validar visualmente.

7. **Verificar plugin Vuetify:**
   - [src/plugins/vuetify.js](../../src/plugins/vuetify.js) deve funcionar sem mudanças. Confirmar que `defaultTheme: "darkblue"` ainda renderiza corretamente.

8. **Build e lint:**
   ```bash
   npm run build
   npm run lint
   ```

9. **Smoke manual** (comparar com screenshots da Fase B passo 2):
   - Shell carrega
   - Ribbon mostra todas as tabs (Coletâneas, Bíblia, Utilidades)
   - Abrir e fechar 3 módulos diferentes (musics, bible, liturgy)
   - Player toca uma música (mesmo se sem áudio, slides avançam)
   - Projection (`/projection`) abre em nova janela
   - Command Palette (Ctrl+K) abre, busca, executa
   - Trocar tema (botão lua/sol no Ribbon)
   - Idioma `es` ainda funciona

10. **Criar ADR:** `docs/adr/0001-vuetify-3-estavel.md` — copiar a seção "Decisão recomendada" desta RFC + data + responsável.

11. **Atualizar CLAUDE.md:**
    - Seção "Stack" — `Vuetify 4` → `Vuetify 3 (estável)`.
    - Adicionar linha: "Vuetify 4 ficou em alpha por tempo demais; voltamos a v3. Reconsiderar quando v4 estável + 3 meses de soak — ver `docs/adr/0001-vuetify-3-estavel.md`."

12. **Commit + PR:**
    ```bash
    git add -A
    git commit -m "[058] Downgrade Vuetify 4 alpha to Vuetify 3 stable

    Vuetify 4 has been in alpha indefinitely; using ^4.0.0 in production
    risked silent visual regressions on every minor bump. Locking to ~3.7.X
    (stable) and replacing the 4 uses of <v-number-input> (v4-only) with
    <v-text-field type=number>.

    Closes plans/refactor-2026/tasks/058-rfc-vuetify-decision.md"
    ```

13. **Atualizar [BACKLOG.md](../BACKLOG.md):** linha 058 → `done`.

## Validação

- [ ] `package.json` mostra `vuetify: "~3.X.Y"` (sem `^4`, sem `alpha`).
- [ ] `npm run build` passa.
- [ ] `npm run lint` passa.
- [ ] `grep -rn "v-number-input" src/` retorna 0.
- [ ] Smoke checklist completa sem regressão visual perceptível.
- [ ] ADR `docs/adr/0001-vuetify-3-estavel.md` criado.
- [ ] CLAUDE.md atualizado.
- [ ] Screenshots before/after arquivados.

## Riscos / atenções

- **Slot APIs sutis.** Algum componente em v3 pode ter slot com nome diferente da v4. Conferir docs do Vuetify 3 para `v-data-table` e `v-text-field` (mais reformulados).
- **Theme `darkblue` custom.** Configurado em [src/plugins/vuetify.js](../../src/plugins/vuetify.js); api de themes é estável entre v3 e v4 mas confirmar.
- **`<v-number-input>` substituto.** `<v-text-field type="number">` não tem step buttons no UI por padrão — se for crítico, criar componente `<NumberInput>` custom.
- **CSS `.v-theme--dark` e tokens.** Já é o cobertura de [tokens.css:254](../../src/assets/styles/tokens.css#L254); independente do Vuetify.
- **Skeleton loader** (`v-skeleton-loader`) — confirmar disponibilidade em v3 (existe).
- **`vite-plugin-vuetify`**: a versão atual (`^2.1.3`) suporta ambos v3 e v4. Não precisa mexer.

## Referências

- Item original do audit: #58, #59.
- [package.json:52](../../package.json#L52)
- [src/plugins/vuetify.js](../../src/plugins/vuetify.js)
- Vuetify 3 docs: https://vuetifyjs.com/en/
- ADR pattern: https://adr.github.io/

---

## Notas pós-execução

- **Aprovação por:** Juan Aleixo, 2026-05-03
- **Branch:** `refactor/058-vuetify-stable`
- **Versão Vuetify final:** `4.0.6` (travado com `~4.0.6`)
- **Decisão alterada:** A RFC previa regressão para v3, mas ao executar foi constatado que Vuetify 4.0.6 já é a versão `latest` no npm (sem prerelease). O critério de reconsideração foi atingido — downgrade para v3 deixou de fazer sentido. Decisão final: manter v4, apenas travar a versão com tilde.
- **Componentes que regrediram:** nenhum. `v-number-input` disponível em v4.0.6, sem substituição necessária. Build e lint passam sem erros.
- **ADR criado:** `docs/adr/0001-vuetify-versao-estavel.md`
- **Tasks novas geradas:** nenhuma.

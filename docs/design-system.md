# Design System — LouvorJA

Documentação do sistema de design do LouvorJA. Todos os tokens visuais estão definidos em
`src/assets/styles/tokens.css` e as classes utilitárias em `src/assets/styles/utilities.css`.

**Regra fundamental:** toda a UI do shell usa exclusivamente esses tokens via `var()`.
Cores hex hardcoded em componentes são consideradas inconsistências e devem ser substituídas.

---

## Paleta de Cores

### Primária — Navy

Azul marinho derivado da skin Delphi original (`officetab` / `BusinessSkinForm`).
Usado em: tabs, titlebar, sidebar do AppMenu, botões primários.

| Token | Valor | Uso |
|---|---|---|
| `--lj-navy` | `#1b4f8a` | Cor base da identidade |
| `--lj-navy-dark` | `#143a66` | Hover sobre navy |
| `--lj-navy-darker` | `#0e2a4c` | Tabs no tema dark |
| `--lj-navy-active` | `#2563a4` | Estado ativo/pressed |
| `--lj-navy-ch` | `27 79 138` | Canais RGB para `rgba()` |
| `--lj-navy-alpha-30` | `rgba(27, 79, 138, 0.3)` | Overlay suave |

### Secundária — Orange

Laranja de acento. Usado em: tabs contextuais, botão fechar sub-tab, sidebar ativo.

| Token | Valor | Uso |
|---|---|---|
| `--lj-orange` | `#f39c12` | Cor base do acento |
| `--lj-orange-dark` | `#cd771b` | Estado ativo/pressed |
| `--lj-orange-darker` | `#b56514` | Pressed profundo |
| `--lj-orange-soft` | `#fef5e9` | Fundo tonal suave |
| `--lj-orange-alpha-12` | `rgba(243, 156, 18, 0.12)` | Overlay muito suave |
| `--lj-orange-alpha-30` | `rgba(243, 156, 18, 0.3)` | Overlay médio |

### Funcionais

| Token | Valor | Uso |
|---|---|---|
| `--lj-danger` | `#dc2626` | Erro, exclusão |
| `--lj-danger-dark` | `#b91c1c` | Hover/pressed em danger |
| `--lj-danger-light` | `#fca5a5` | Texto de erro no dark theme |
| `--lj-danger-soft` | `rgba(220, 38, 38, 0.12)` | Fundo de alerta de erro |
| `--lj-danger-border` | `rgba(220, 38, 38, 0.3)` | Borda de erro |
| `--lj-success` | `#16a34a` | Confirmação, sucesso |
| `--lj-success-soft` | `rgba(22, 163, 74, 0.12)` | Fundo de alerta de sucesso |
| `--lj-warning` | `#ea580c` | Aviso |
| `--lj-warning-dark` | `#d97706` | Hover em warning |
| `--lj-info` | `#2563eb` | Informação |
| `--lj-info-light` | `#6ea0d0` | Link no dark theme |

### Cores de Projeção

Específicas para as telas de projeção, operador e stage display — inspiradas nas
cores fixas do app Delphi original.

| Token | Valor | Uso |
|---|---|---|
| `--lj-color-cover-gold` | `#efb400` | Capa do slide (fundo cover) |
| `--lj-slide-text-gold` | `#f6c32a` | Texto de slide (cover + repeat) |
| `--lj-color-projection-bg` | `#000000` | Fundo da tela `/projection` |
| `--lj-color-return-bg` | `#293329` | Fundo do stage display `/projection/return` |
| `--lj-color-operator-panel` | `#353535` | Painel lateral do `/operator` |
| `--lj-color-operator-grid` | `#232323` | Grade de slides do `/operator` |
| `--lj-color-operator-line` | `#524752` | Linha de separação no operador |
| `--lj-color-list-bg` | `#232323` | Fundo de listas em projeção |
| `--lj-color-splash-bg` | `#2d2d28` | Fundo da tela de splash |
| `--lj-color-favorites-line` | `#e8e8e8` | Linha de favoritos (light) |
| `--lj-color-cover-gold-dark` | `#c89500` | Capa no player dark |
| `--lj-gold-alpha-60` | `rgba(239, 180, 0, 0.6)` | Overlay gold semi-transparente |

---

## Escala de Cinzas

Escala de 9 passos de `#f7f9fc` a `#131820`. Usada como base para superfícies,
bordas, texto muted e outros elementos neutros.

| Token | Valor |
|---|---|
| `--lj-gray-50` | `#f7f9fc` |
| `--lj-gray-100` | `#eef2f7` |
| `--lj-gray-200` | `#dde4ed` |
| `--lj-gray-300` | `#c5d0dc` |
| `--lj-gray-400` | `#9aa6b5` |
| `--lj-gray-500` | `#6b7888` |
| `--lj-gray-600` | `#505e6e` |
| `--lj-gray-700` | `#3a4654` |
| `--lj-gray-800` | `#232c38` |
| `--lj-gray-900` | `#131820` |

---

## Superfícies e Texto

Tokens semânticos que mudam automaticamente entre tema light e dark.
Prefira esses em vez dos cinzas diretos.

### Superfícies

| Token | Light | Dark |
|---|---|---|
| `--lj-surface-bg` | `#ffffff` | `#1f2937` |
| `--lj-surface-bg-soft` | gray-50 | `#161e2c` |
| `--lj-surface-bg-hover` | gray-100 | `#243248` |
| `--lj-surface-bg-active` | gray-200 | `#2d3a52` |
| `--lj-surface-border` | gray-200 | `#2a3441` |
| `--lj-surface-border-strong` | gray-300 | `#3a4654` |
| `--lj-surface-divider` | gray-100 | `#2a3441` |

### Texto

| Token | Light | Dark |
|---|---|---|
| `--lj-text` | gray-800 | `#e5e7eb` |
| `--lj-text-muted` | gray-600 | `#9aa3ad` |
| `--lj-text-subtle` | gray-500 | `#6b7280` |
| `--lj-text-on-navy` | `rgba(255,255,255,0.92)` | — |
| `--lj-text-on-navy-muted` | `rgba(255,255,255,0.7)` | — |
| `--lj-on-surface-ch` | `35 44 56` (light) / `229 231 235` (dark) | Canais RGB de `--lj-text` para uso em `rgba()` |

### Genéricos

| Token | Uso |
|---|---|
| `--lj-white` | `#ffffff` fixo (sem override dark) |
| `--lj-hover-bg` | Alias de `--lj-surface-bg-hover` |
| `--lj-active-bg` | Navy 8% (light) / Azul 15% (dark) |
| `--lj-focus-ring` | `0 0 0 2px rgba(navy, 0.4)` — foco visível |
| `--lj-divider` | Alias de `--lj-surface-divider` |
| `--lj-link-color` | Navy (light) / `--lj-info-light` (dark) |
| `--lj-scrollbar-thumb-bg` | Black 18% (light) / White 18% (dark) |
| `--lj-alert-error-color` | danger-dark (light) / danger-light (dark) |
| `--lj-live-bg` | Gradiente vermelho (banner live pulsante) |
| `--lj-live-color` | `#ffffff` |

### Transparências utilitárias

Overlays pré-definidos para hover, press e sombras.

| Token | Valor |
|---|---|
| `--lj-white-alpha-08` | `rgba(255,255,255,0.08)` |
| `--lj-white-alpha-10` | `rgba(255,255,255,0.1)` |
| `--lj-white-alpha-18` | `rgba(255,255,255,0.18)` |
| `--lj-white-alpha-20` | `rgba(255,255,255,0.2)` |
| `--lj-white-alpha-25` | `rgba(255,255,255,0.25)` |
| `--lj-black-alpha-18` | `rgba(0,0,0,0.18)` |
| `--lj-black-alpha-20` | `rgba(0,0,0,0.2)` |
| `--lj-black-alpha-30` | `rgba(0,0,0,0.3)` |
| `--lj-black-alpha-40` | `rgba(0,0,0,0.4)` |
| `--lj-black-alpha-75` | `rgba(0,0,0,0.75)` |
| `--lj-navy-alpha-30` | `rgba(27,79,138,0.3)` |

---

## Tipografia

### Famílias de Fonte

| Token | Família | Uso |
|---|---|---|
| `--lj-font-shell` | Tahoma, Segoe UI, Helvetica Neue | Interface geral do shell |
| `--lj-font-projection` | DINCondensedBold, DIN Condensed, Bebas Neue, Arial Narrow | Telas de projeção (`/projection`, `/obs`) |
| `--lj-font-mono` | SF Mono, Consolas | Código, timestamps |

A fonte `DINCondensedBold` é carregada em `src/assets/styles/fonts.css` e replica
a tipografia do app Delphi original.

### Escala de Tamanhos

| Token | Valor | Contexto |
|---|---|---|
| `--lj-text-xs` | `10px` | Badges, group labels |
| `--lj-text-sm` | `11px` | Status bar |
| `--lj-text-base` | `12px` | Ribbon body (padrão) |
| `--lj-text-md` | `12.5px` | Tabs |
| `--lj-text-lg` | `14px` | Títulos de módulos |
| `--lj-text-xl` | `16px` | Títulos de popups |
| `--lj-text-2xl` | `22px` | Hero (Sobre, Opções) |

### Pesos de Fonte

| Token | Valor |
|---|---|
| `--lj-weight-regular` | `400` |
| `--lj-weight-medium` | `500` |
| `--lj-weight-semibold` | `600` |
| `--lj-weight-bold` | `700` |

---

## Espaçamento

Escala de 8 passos com base de 4px.

| Token | Valor | Uso |
|---|---|---|
| `--lj-space-1` | `2px` | Espaço mínimo (ex: padding de badge) |
| `--lj-space-2` | `4px` | Padrão mínimo de gap |
| `--lj-space-3` | `6px` | Gap interno de itens compactos |
| `--lj-space-4` | `8px` | Gap padrão entre elementos |
| `--lj-space-5` | `12px` | Padding interno de botões/cards |
| `--lj-space-6` | `16px` | Espaço entre seções |
| `--lj-space-7` | `20px` | Padding de painéis |
| `--lj-space-8` | `24px` | Espaço maior entre blocos |

---

## Border Radius

| Token | Valor | Uso |
|---|---|---|
| `--lj-radius-xs` | `2px` | Tags, badges pequenos |
| `--lj-radius-sm` | `3px` | Botões padrão |
| `--lj-radius-md` | `4px` | Popups, cards |
| `--lj-radius-lg` | `6px` | Dialogs |
| `--lj-radius-tab` | `4px 4px 0 0` | Tabs (topo arredondado) |

---

## Elevação e Sombras

### Sombras de Elevação

Três níveis de profundidade para criar hierarquia visual.

| Token | Valor | Uso |
|---|---|---|
| `--lj-shadow-1` | `0 1px 3px rgba(0,0,0,0.1)` | Cards, botões ligeiramente elevados |
| `--lj-shadow-2` | `0 2px 8px rgba(0,0,0,0.15)` | Dropdowns, tooltips |
| `--lj-shadow-3` | `0 4px 16px rgba(0,0,0,0.2)` | Modais, drawers |

Exemplo:
```css
.card {
  box-shadow: var(--lj-shadow-2);
}
```

### Focus Rings

| Token | Valor | Uso |
|---|---|---|
| `--lj-focus-ring` | `0 0 0 2px rgba(navy, 0.4)` | Foco acessível padrão |
| `--lj-shadow-focus-navy` | `0 0 0 2px rgba(navy, 0.2)` | Foco suave (elementos embutidos) |
| `--lj-shadow-focus-navy-sm` | `0 0 0 2px rgba(navy, 0.15)` | Foco muito sutil |

---

## Animações e Transições

| Token | Valor | Uso |
|---|---|---|
| `--lj-fade-duration` | `256ms` | Duração de fades Vue (`<transition>`) |
| `--lj-transition-fast` | `0.08s ease` | Hover imediato (botões, ícones) |
| `--lj-transition-normal` | `0.15s ease` | Transição padrão de estado |
| `--lj-transition-slow` | `0.25s ease` | Abertura de painel, drawer |

Exemplo:
```css
.btn {
  transition: background-color var(--lj-transition-fast);
}
```

---

## Dimensões de Componentes Shell

Valores fixos que replicam as dimensões originais do app Delphi (`fmMenu.dfm`).
Não alterar sem validar o layout completo.

### Alturas

| Token | Valor | Componente |
|---|---|---|
| `--lj-systembar-height` | `28px` | SystemBar superior |
| `--lj-tab-height` | `28px` | Tabs do Ribbon |
| `--lj-ribbon-body-height` | `80px` | Body do Ribbon |
| `--lj-group-label-height` | `18px` | Label de grupo no Ribbon |
| `--lj-subtabs-height` | `28px` | Sub-tabs internas dos módulos |
| `--lj-player-height` | `88px` | Footer / Player |
| `--lj-player-title-height` | `22px` | Título no player |
| `--lj-player-row-height` | `46px` | Linha de controles do player |
| `--lj-player-gauge-height` | `20px` | Barra de progresso do player |
| `--lj-statusbar-height` | `24px` | Status bar inferior |
| `--lj-small-btn-height` | `22px` | Botão pequeno do Ribbon |
| `--lj-large-btn-height` | `70px` | Botão grande do Ribbon |
| `--lj-player-btn-height` | `38px` | Botão do player |

### Larguras

| Token | Valor | Componente |
|---|---|---|
| `--lj-sidebar-width` | `250px` | Sidebar expandida |
| `--lj-sidebar-collapsed` | `28px` | Sidebar colapsada |
| `--lj-appmenu-width` | `44px` | Botão do App Menu (hambúrguer) |
| `--lj-fixed-btn-width` | `30px` | Botão fixo pequeno |
| `--lj-large-btn-width` | `76px` | Botão grande do Ribbon |
| `--lj-player-btn-width` | `36px` | Botão padrão do player |
| `--lj-player-btn-primary-width` | `55px` | Botão primário do player (play/pause) |

---

## Tokens por Componente

### Ribbon — TitleBar e Body

```css
/* TitleBar (acima das tabs) */
background: var(--lj-titlebar-bg);   /* navy */
color: var(--lj-titlebar-color);     /* #ffffff */

/* Body (sempre claro, sem variação contextual de tab) */
background: var(--lj-body-bg);
background: var(--lj-body-bg-ctx);   /* idem para tabs contextuais */
border: 1px solid var(--lj-body-border);
border-color: var(--lj-body-divider); /* divisor interno entre grupos */
```

### Ribbon — Group Label e Kbd

```css
/* Rótulo de grupo de botões */
color: var(--lj-group-label-color);  /* text-subtle */

/* Badge de tecla de atalho (<kbd>) */
background: var(--lj-kbd-bg);
border: 1px solid var(--lj-kbd-border);
```

### Status Bar

```css
background: var(--lj-statusbar-bg);
border-top: 1px solid var(--lj-statusbar-border);
color: var(--lj-statusbar-color);
border-color: var(--lj-statusbar-divider); /* divisor entre seções */
```

### Player — Gauge

```css
/* Cores brutas para compor gradiente (use os compostos abaixo) */
/* --lj-player-gauge-light-start: #c4d8ef */
/* --lj-player-gauge-light-end:   #aabfd5 */
/* --lj-player-gauge-dark-end:    #0f172a  */

/* Token composto (já adaptado por tema): */
background: var(--lj-player-gauge-bg);

/* Faixa de buffer (carregado mas não reproduzido) */
background: var(--lj-player-gauge-buffer-bg);  /* white 25% (light) / white 8% (dark) */
```

### Sub-tab — Botão Fechar

```css
.subtab-close { color: var(--lj-subtab-close-color); }
.subtab-close:hover { background: var(--lj-subtab-close-hover-bg); }
```

---

### Ribbon — Tabs

```css
/* fundo navy com item ativo branco */
background: var(--lj-tabs-bg);          /* navy */
color: var(--lj-tabs-color);            /* white 92% */

/* hover */
background: var(--lj-tabs-hover-bg);   /* white 8% */
color: var(--lj-tabs-color-hover);     /* white 100% */

/* ativo */
background: var(--lj-tabs-active-bg);  /* #fff (light) / #243248 (dark) */
color: var(--lj-tabs-active-color);    /* gray-800 (light) / #fff (dark) */
```

### Ribbon — Tabs Contextuais (laranja)

```css
background: var(--lj-tabs-ctx-bg);          /* orange */
color: var(--lj-tabs-ctx-color);            /* #fff */

/* hover */
background: var(--lj-tabs-ctx-hover-bg);    /* orange clareado */

/* ativo */
background: var(--lj-tabs-ctx-active-bg);   /* gradiente orange → orange-dark */
```

### Ribbon — Botões

```css
color: var(--lj-rbtn-color);

/* hover */
background: var(--lj-rbtn-hover-bg);
border-color: var(--lj-rbtn-hover-border);

/* pressed */
background: var(--lj-rbtn-active-bg);
border-color: var(--lj-rbtn-active-border);
```

### Sub-tabs (módulos)

```css
/* barra */
background: var(--lj-subtabs-bg);
border-bottom: 1px solid var(--lj-subtabs-border);

/* tab inativa */
background: var(--lj-subtab-bg);
color: var(--lj-subtab-color);

/* tab hover */
background: var(--lj-subtab-hover-bg);

/* tab ativa */
background: var(--lj-subtab-active-bg);
color: var(--lj-subtab-active-color);

/* botão fechar */
color: var(--lj-subtab-close-color);          /* orange */
```

### Player / Footer

```css
background: var(--lj-footer-bg);
border-top: 1px solid var(--lj-footer-border);

/* gauge */
background: var(--lj-player-gauge-bg);         /* gradiente (muda por tema) */

/* texto de slide */
color: var(--lj-player-slide-text-color);      /* text (light) / gold (dark) */
```

### Popups e Dialogs

```css
background: var(--lj-popup-bg);
border: 1px solid var(--lj-popup-border);
box-shadow: var(--lj-popup-shadow);
border-radius: var(--lj-radius-md);   /* cards */
/* ou */
border-radius: var(--lj-radius-lg);   /* dialogs */
```

### AppMenu Sidebar

```css
background: var(--lj-appmenu-sidebar-bg);          /* navy */
color: var(--lj-appmenu-sidebar-color);            /* white 70% */

/* item hover */
background: var(--lj-appmenu-sidebar-hover-bg);    /* white 8% */

/* item ativo */
background: var(--lj-appmenu-sidebar-active-bg);   /* orange */
color: var(--lj-appmenu-sidebar-active-color);     /* #fff */
```

---

## Classes Utilitárias (`.lj-u-*`)

Definidas em `src/assets/styles/utilities.css`. Aplicar apenas em componentes do
shell (`src/components/`, `src/layout/`). Módulos em `src/modules/` mantêm CSS
`<style scoped>` próprio.

### Flexbox

```html
<!-- linha alinhada ao centro -->
<div class="lj-u-row">...</div>

<!-- linha com space-between -->
<div class="lj-u-row-between">...</div>

<!-- preenche espaço disponível sem overflow (flex: 1 + min-width: 0) -->
<span class="lj-u-fill">texto longo truncado</span>
```

### Texto

```html
<!-- truncar com reticências (precisa de largura definida no pai) -->
<span class="lj-u-truncate">Título muito longo que será truncado...</span>
```

### Interação

```html
<!-- desabilitar seleção de texto (ex: labels, botões do ribbon) -->
<div class="lj-u-no-select">Rótulo</div>
```

### Gap

Use em containers flex/grid combinado com `.lj-u-row`:

```html
<div class="lj-u-row lj-u-gap-3">
  <span>Item 1</span>
  <span>Item 2</span>
</div>
```

| Classe | Gap |
|---|---|
| `.lj-u-gap-1` | `2px` |
| `.lj-u-gap-2` | `4px` |
| `.lj-u-gap-3` | `6px` |
| `.lj-u-gap-4` | `8px` |
| `.lj-u-gap-5` | `12px` |
| `.lj-u-gap-6` | `16px` |

### Larguras Percentuais (legacy)

Classes `.w-10` a `.w-100` (step 10%) com `!important`. Usar apenas quando
necessário — prefira flexbox com `lj-u-fill` para layouts responsivos.

---

## Convenções de Uso

### Nunca usar cores hex diretamente em componentes

```css
/* ERRADO */
.meu-componente { background: #1b4f8a; }

/* CORRETO */
.meu-componente { background: var(--lj-navy); }
```

### Usar tokens semânticos de superfície em vez de cinzas diretos

```css
/* ERRADO */
.painel { background: var(--lj-gray-50); border: 1px solid var(--lj-gray-200); }

/* CORRETO — muda automaticamente no dark theme */
.painel { background: var(--lj-surface-bg-soft); border: 1px solid var(--lj-surface-border); }
```

### Usar `!important` somente nas classes `.w-*` (legacy)

Outros estilos não devem precisar de `!important`. Se precisar, revisar especificidade.

### Escopo de utilitárias

```
src/components/  ✅ usar .lj-u-*
src/layout/      ✅ usar .lj-u-*
src/modules/     ❌ não usar (CSS scoped próprio de cada módulo)
```

---

## Arquivos de Referência

| Arquivo | Conteúdo |
|---|---|
| `src/assets/styles/tokens.css` | Todos os tokens CSS (395 linhas) — fonte canônica |
| `src/assets/styles/utilities.css` | Classes `.lj-u-*` (61 linhas) |
| `src/assets/styles/main.css` | Reset global, scrollbar, `.no-select` legado |
| `src/assets/styles/fonts.css` | `@font-face DINCondensedBold` |
| `src/assets/styles/main.scss` | Entry point que importa todos os arquivos acima |

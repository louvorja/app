---
id: 086
title: Configurar CSP / headers de segurança (PWA web)
slug: csp-headers
category: seguranca
wave: seguranca
model: opus
priority: P2
estimate_hours: 3
status: done
depends_on: []
blocks: []
audit_items: [86]
---

# [086] CSP + headers de segurança

## Contexto

PWA web não tem CSP definido. Sem CSP, qualquer `<script>` injetado (XSS bem-sucedido) executa livremente. Headers como `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security` também ausentes.

Como PWA é servido por um host externo, a config dos headers depende do host. Mas é possível definir CSP via `<meta http-equiv="Content-Security-Policy">` no `index.html` como fallback.

## Objetivo

- CSP configurado via `<meta>` em `index.html`.
- Documentação de headers HTTP recomendados em `CLAUDE.md` ou `docs/security.md`.
- Modo Electron: CSP definido via `webRequest.onHeadersReceived`.

## Escopo

### Dentro
- `<meta http-equiv="Content-Security-Policy">` em `index.html` com policy restritiva.
- Documentação de headers para deploy.
- Verificar que app continua funcionando (Vuetify, Vue, BroadcastChannel, etc.).

### Fora
- **NÃO** configurar headers no servidor — só documentar.

## Arquivos afetados

- [index.html](../../index.html)
- `docs/security.md` (criar) ou seção em CLAUDE.md
- [electron/main.cjs](../../electron/main.cjs) (Electron CSP)

## Plano de execução

1. Branch `sec/086-csp`.
2. Adicionar em `index.html`:
   ```html
   <meta http-equiv="Content-Security-Policy" content="
     default-src 'self';
     script-src 'self' 'unsafe-inline';
     style-src 'self' 'unsafe-inline' fonts.googleapis.com;
     font-src 'self' fonts.gstatic.com data:;
     img-src 'self' data: https:;
     media-src 'self' https:;
     connect-src 'self' https://*.louvorja.com.br https://api.louvorja.com.br ws://localhost:* http://localhost:*;
   ">
   ```
3. Smoke: app abre, fontes carregam, áudio toca, BroadcastChannel funciona.
4. Ajustar policy para qualquer recurso bloqueado.
5. No Electron, configurar CSP via `session.webRequest.onHeadersReceived`.
6. Documentar em `docs/security.md`:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Strict-Transport-Security: max-age=31536000`
7. Commit: `[086] Add CSP meta tag and security headers documentation`.

## Validação

- [ ] DevTools Console sem erros de CSP em uso normal.
- [ ] App carrega fontes, imagens, áudio normalmente.
- [ ] `npm run build` passa.

## Riscos / atenções

- **`unsafe-inline`** em styles: necessário para Vuetify (inline styles dinâmicos). Aceitar como tradeoff.
- **Vue templates**: `script-src 'unsafe-eval'` pode ser necessário se Vue usar runtime template compilation. Verificar.
- **WebSocket dev**: `connect-src` precisa de `ws://localhost:*` para HMR.

## Referências

- Item audit: #86.
- MDN CSP: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP.
- OWASP Secure Headers: https://owasp.org/www-project-secure-headers/.

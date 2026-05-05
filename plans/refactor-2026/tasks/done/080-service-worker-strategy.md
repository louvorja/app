---
id: 080
title: Auditar e ajustar Service Worker (offline-first vs network-first)
slug: service-worker-strategy
category: performance
wave: performance
model: opus
priority: P2
estimate_hours: 3
status: done
depends_on: []
blocks: []
audit_items: [80]
---

# [080] Service Worker — estratégia offline-first

## Contexto

PWA tem Service Worker, mas estratégia de cache não está documentada. Em ambiente de culto (Wi-Fi instável), uso offline é crítico — operador não pode depender de rede para abrir música ou Bíblia. Mas atualmente não há clareza sobre o que está cacheado e quando invalida.

`vite-plugin-pwa` (se em uso) ou Workbox define estratégias por path. Decisão técnica: assets estáticos (`*.js`, `*.css`, fonts) → cache-first; JSONs do banco (`pt_musics.json`) → stale-while-revalidate; áudio/imagens → cache-first com TTL longo.

## Objetivo

- Service Worker config explícita por padrão de URL.
- App funciona 100% offline após primeira visita (com banco já cacheado).
- Atualização de banco (#071) propaga sem precisar de hard reload.

## Escopo

### Dentro
- Auditar `vite.config.js` para detectar plugin PWA.
- Configurar runtime caching em `vite-plugin-pwa` ou Workbox.
- Documentar estratégia em `CLAUDE.md`.

### Fora
- **NÃO** implementar tela "Offline mode" custom.
- **NÃO** lidar com sincronização background — escopo separado.

## Arquivos afetados

- [vite.config.js](../../vite.config.js)
- [CLAUDE.md](../../CLAUDE.md) (documentação)

## Plano de execução

1. Branch `perf/080-service-worker`.
2. Verificar se `vite-plugin-pwa` está instalado:
   ```bash
   grep -i "pwa" package.json vite.config.js
   ```
3. Configurar runtime caching:
   ```js
   workbox: {
     runtimeCaching: [
       { urlPattern: /\.json$/, handler: 'StaleWhileRevalidate' },
       { urlPattern: /\.(mp3|jpg|png)$/, handler: 'CacheFirst', options: { expiration: { maxAgeSeconds: 30*24*3600 } } },
     ],
   }
   ```
4. Build PWA, verificar no DevTools Application tab que SW está ativo.
5. Test offline: DevTools → Network → Offline → recarregar → app abre.
6. Commit: `[080] Configure Service Worker runtime caching strategies`.

## Validação

- [ ] App abre offline após primeira visita.
- [ ] DevTools Application: SW ativo, cache populado.
- [ ] `npm run build` gera `sw.js`.

## Riscos / atenções

- **Cache stale**: usuário pode ficar com versão antiga do app por dias se não tiver invalidação. Configurar `skipWaiting: true` + `clientsClaim: true`.
- **Eletron vs PWA**: SW é só PWA. No Electron, outro mecanismo de cache (D2 do roadmap).

## Referências

- Item audit: #80.
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/).
- [Workbox strategies](https://developer.chrome.com/docs/workbox/caching-strategies-overview/).

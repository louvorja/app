<template>
  <template v-if="import_modules">
    <!-- Marcador para testes E2E aguardarem o boot dos módulos (vide liturgy.spec.js) -->
    <span data-testid="modules-ready" aria-hidden="true" style="display: none" />
    <component :is="getComponent(module.id)" v-for="module in modules" :key="module.id" />
  </template>
</template>

<script setup>
import { defineAsyncComponent, computed } from "vue";
import $appdata from "@/helpers/AppData";
import $modules from "@/helpers/Modules";

// Glob estático — Vite analisa em build-time e gera importações individuais.
// Substitui template literals variáveis que falham no headless Chromium (Playwright).
const _globCore = import.meta.glob("@/modules/core/*/interface/Index.vue");
const _globBase = import.meta.glob("@/modules/*/interface/Index.vue");

// Cache de async components por moduleId. Sem isto, cada render de Modules.vue
// criaria um defineAsyncComponent novo, fazendo Vue desmontar e remontar todos
// os módulos a cada interação — o que quebra o estado interno e causa erros de
// "Cannot read properties of null (reading 'type')" durante unmount em transit.
const _componentCache = new Map();

function buildAsyncComponent(moduleId) {
  return defineAsyncComponent({
    loader: () => {
      const coreKey = `/src/modules/core/${moduleId}/interface/Index.vue`;
      const baseKey = `/src/modules/${moduleId}/interface/Index.vue`;
      if (_globCore[coreKey]) return _globCore[coreKey]();
      if (_globBase[baseKey]) return _globBase[baseKey]();
      return Promise.reject(new Error(`[Modules] módulo não encontrado: ${moduleId}`));
    },
    onError(err, retry, fail) {
      console.error(`[Modules] erro ao carregar "${moduleId}":`, err);
      fail();
    },
    delay: 0,
    // Mostra um placeholder vazio durante o carregamento (evita flicker)
    loadingComponent: { name: `Loading_${moduleId}`, render: () => null },
    // Componente exibido se o load falhar definitivamente
    errorComponent: {
      name: `Broken_${moduleId}`,
      render() {
        return null;
      },
    },
  });
}

function getComponent(moduleId) {
  if (!_componentCache.has(moduleId)) {
    _componentCache.set(moduleId, buildAsyncComponent(moduleId));
  }
  return _componentCache.get(moduleId);
}

const modules = computed(() => $modules.get());
const import_modules = computed(() => $appdata.get("import_modules"));

defineExpose({ getComponent });
</script>

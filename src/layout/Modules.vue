<template>
  <template v-if="import_modules">
    <component :is="getComponent(module.id)" v-for="module in modules" :key="module.id" />
  </template>
</template>

<script setup>
import { defineAsyncComponent, computed, getCurrentInstance } from "vue";

const { proxy } = getCurrentInstance();

// Cache de async components por moduleId. Sem isto, cada render de Modules.vue
// criaria um defineAsyncComponent novo, fazendo Vue desmontar e remontar todos
// os módulos a cada interação — o que quebra o estado interno e causa erros de
// "Cannot read properties of null (reading 'type')" durante unmount em transit.
const _componentCache = new Map();

function buildAsyncComponent(moduleId) {
  return defineAsyncComponent({
    loader: () =>
      import(`@/modules/core/${moduleId}/interface/Index.vue`).catch(
        () => import(`@/modules/${moduleId}/interface/Index.vue`)
      ),
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

const modules = computed(() => proxy.$modules.get());
const import_modules = computed(() => proxy.$appdata.get("import_modules"));

defineExpose({ getComponent });
</script>

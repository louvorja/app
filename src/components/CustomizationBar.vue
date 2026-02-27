<template>
  <v-bottom-sheet>
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn
        class="ms-2"
        icon="mdi-palette"
        variant="text"
        size="small"
        v-bind="activatorProps"
      />
    </template>

    <v-card>
      <slot />
    </v-card>
  </v-bottom-sheet>
</template>

<script>
export default {
  name: "CustomizationBarComponent",
};
</script>

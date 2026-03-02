<template>
  <v-slide-group-item>
    <v-card flat>
      <v-card-text class="pa-2 px-1">
        <slot />
      </v-card-text>
    </v-card>
  </v-slide-group-item>
</template>

<script>
export default {
  name: "ToolBarItemComponent",
};
</script>

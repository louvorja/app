<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn v-bind="props" slim>
        <country-flag
          v-if="current_language"
          :country="languages[current_language].flag"
          style="margin: 0; padding: 0"
        />
      </v-btn>
    </template>
    <v-list>
      <v-list-item v-for="(language, key) in languages" :key="key" @click="changeLanguage(key)">
        <template #prepend>
          <country-flag :country="language.flag" style="margin: 0; padding: 0" />
        </template>
        <v-list-item-title>
          {{ language.name }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import CountryFlag from "vue-country-flag-next";
import AppData from "@/helpers/AppData";
import UserData from "@/helpers/UserData";

const { locale } = useI18n();

const languages = computed(() => AppData.get("languages"));
const current_language = computed(() => UserData.get("language"));

function changeLanguage(language) {
  locale.value = language;
  UserData.set("language", language);
}
</script>

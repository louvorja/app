<template>
  <div class="about">
    <div class="about-hero">
      <div class="about-logo">
        <span class="about-logo-letter">L</span>
        <span class="about-logo-letter about-logo-letter--accent">JA</span>
      </div>
      <div class="about-hero-text">
        <h1 class="about-product">LouvorJA</h1>
        <p class="about-tagline">{{ $t("about.tagline") }}</p>
      </div>
    </div>

    <div class="about-info">
      <div class="about-info-row">
        <span class="about-info-label">{{ $t("about.version") }}</span>
        <span class="about-info-value">{{ versionLabel }}</span>
      </div>
      <div class="about-info-row">
        <span class="about-info-label">{{ $t("about.build") }}</span>
        <span class="about-info-value">
          {{ buildInfo }}
        </span>
      </div>
      <div class="about-info-row">
        <span class="about-info-label">{{ $t("about.platform") }}</span>
        <span class="about-info-value">{{ platformLabel }}</span>
      </div>
    </div>

    <div class="about-actions">
      <a
        class="about-link"
        href="https://www.louvorja.com.br"
        target="_blank"
        rel="noopener noreferrer"
      >
        <v-icon icon="mdi-web" size="16" />
        louvorja.com.br
      </a>
      <a
        class="about-link"
        href="https://github.com/juanaleixo/louvorja/issues"
        target="_blank"
        rel="noopener noreferrer"
      >
        <v-icon icon="mdi-bug-outline" size="16" />
        {{ $t("shell.appmenu_items.feedback") }}
      </a>
    </div>

    <p class="about-credits">{{ $t("about.credits") }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import packageJson from "@root/package.json";
import Platform from "@/helpers/Platform";
import $database from "@/helpers/Database";

const dbVersion = ref(0);

const versionLabel = computed(() => `${packageJson.version}.${dbVersion.value}`);

const buildInfo = computed(() => {
  const parts = [];
  if (Platform.isDesktop) {
    parts.push("Desktop");
    if (Platform.electronVersion) parts.push(`Electron ${Platform.electronVersion}`);
  } else {
    parts.push("Web/PWA");
  }
  return parts.join(" · ");
});

const platformLabel = computed(() => {
  const map = { darwin: "macOS", win32: "Windows", linux: "Linux" };
  return map[Platform.platform] || (Platform.isDesktop ? "Desktop" : "Browser");
});

async function loadDBVersion() {
  try {
    const config = await $database.get("config");
    dbVersion.value = config?.version_number ?? "?";
  } catch {
    dbVersion.value = "?";
  }
}

onMounted(loadDBVersion);
</script>

<style scoped>
.about {
  font-family: var(--lj-font-shell);
  color: var(--lj-text);
  max-width: 720px;
}

.about-hero {
  display: flex;
  align-items: center;
  gap: var(--lj-space-6);
  padding-bottom: var(--lj-space-7);
  border-bottom: 1px solid var(--lj-surface-border);
  margin-bottom: var(--lj-space-7);
}

.about-logo {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--lj-color-cover-gold) 0%, var(--lj-navy) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 16px var(--lj-navy-alpha-30);
}

.about-logo-letter {
  font-size: 36px;
  font-weight: var(--lj-weight-bold);
  color: var(--lj-white);
  letter-spacing: -0.02em;
  text-shadow: 0 2px 4px var(--lj-black-alpha-30);
}

.about-logo-letter--accent {
  color: var(--lj-color-cover-gold);
  font-size: 22px;
  margin-left: 2px;
  align-self: flex-end;
  margin-bottom: 4px;
}

.about-product {
  font-size: 36px;
  font-weight: var(--lj-weight-regular);
  margin: 0;
  letter-spacing: -0.01em;
}

.about-tagline {
  font-size: var(--lj-text-base);
  color: var(--lj-text-muted);
  margin: var(--lj-space-2) 0 0;
}

.about-info {
  margin-bottom: var(--lj-space-7);
}

.about-info-row {
  display: flex;
  align-items: center;
  padding: var(--lj-space-3) 0;
  border-bottom: 1px solid var(--lj-surface-divider);
  font-size: var(--lj-text-base);
}

.about-info-row:last-child {
  border-bottom: none;
}

.about-info-label {
  flex: 0 0 auto;
  min-width: 140px;
  color: var(--lj-text-muted);
}

.about-info-value {
  font-weight: var(--lj-weight-medium);
  font-variant-numeric: tabular-nums;
}

.about-actions {
  display: flex;
  gap: var(--lj-space-5);
  margin-bottom: var(--lj-space-7);
  flex-wrap: wrap;
}

.about-link {
  display: inline-flex;
  align-items: center;
  gap: var(--lj-space-2);
  text-decoration: none;
  color: var(--lj-link-color);
  font-size: var(--lj-text-base);
  font-weight: var(--lj-weight-medium);
  padding: var(--lj-space-3) var(--lj-space-5);
  background: var(--lj-surface-bg-soft);
  border: 1px solid var(--lj-surface-border);
  border-radius: var(--lj-radius-sm);
  transition:
    background var(--lj-transition-fast),
    border-color var(--lj-transition-fast);
}

.about-link:hover {
  background: var(--lj-surface-bg-hover);
  border-color: var(--lj-navy);
}

.about-credits {
  font-size: var(--lj-text-sm);
  color: var(--lj-text-subtle);
  font-style: italic;
  margin: 0;
}
</style>

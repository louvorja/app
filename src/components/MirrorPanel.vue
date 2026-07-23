<template>
  <v-dialog v-model="show" max-width="420">
    <template v-slot:activator="{ props }">
      <v-tooltip :text="t('tooltip')">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-btn v-bind="{ ...props, ...tooltipProps }" icon="mdi-qrcode" />
        </template>
      </v-tooltip>
    </template>

    <v-card>
      <v-card-title>{{ t("title") }}</v-card-title>
      <v-card-text>
        <v-alert
          v-if="!configured"
          type="warning"
          variant="tonal"
          density="compact"
          :text="t('not_configured')"
        />

        <template v-else-if="!active">
          <p class="text-body-2 mb-4">{{ t("description") }}</p>
          <v-btn
            color="primary"
            variant="flat"
            block
            :loading="starting"
            @click="startMirroring"
          >
            {{ t("start") }}
          </v-btn>
        </template>

        <template v-else>
          <div class="d-flex flex-column align-center">
            <canvas ref="qrCanvas" class="mb-3" />
            <div class="text-h5 font-weight-bold mb-1" style="letter-spacing: 0.1em">
              {{ sessionId }}
            </div>
            <div class="text-caption text-medium-emphasis text-center mb-4">
              {{ t("code_hint") }}
            </div>
            <v-chip size="small" prepend-icon="mdi-account-multiple" variant="tonal">
              {{ t("viewers", { count: viewerCount }) }}
            </v-chip>
          </div>
        </template>
      </v-card-text>
      <v-card-actions v-if="active">
        <v-spacer />
        <v-btn color="error" variant="text" :loading="stopping" @click="stopMirroring">
          {{ t("stop") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import QRCode from "qrcode";
import $mirror from "@/helpers/Mirror";

export default {
  name: "MirrorPanel",
  data: () => ({
    show: false,
    starting: false,
    stopping: false,
    viewerCount: 0,
    pollTimer: null,
  }),
  computed: {
    configured() {
      return $mirror.isConfigured();
    },
    active() {
      return !!this.$userdata.get("mirror.session_id");
    },
    sessionId() {
      return this.$userdata.get("mirror.session_id");
    },
  },
  watch: {
    show(value) {
      if (value && this.active) {
        this.renderQrCode();
        this.startPolling();
      } else {
        this.stopPolling();
      }
    },
    active(value) {
      if (value) {
        this.$nextTick(() => this.renderQrCode());
      }
    },
  },
  methods: {
    t(text, params) {
      return this.$t(`components.mirror_panel.${text}`, params);
    },
    async startMirroring() {
      this.starting = true;
      try {
        await $mirror.start();
        await this.$nextTick();
        this.renderQrCode();
        this.startPolling();
      } catch (e) {
        this.$alert.error({
          text: "components.mirror_panel.start_error",
          error: e,
        });
      } finally {
        this.starting = false;
      }
    },
    async stopMirroring() {
      this.stopping = true;
      try {
        await $mirror.stop();
        this.stopPolling();
      } finally {
        this.stopping = false;
      }
    },
    renderQrCode() {
      if (!this.$refs.qrCanvas || !this.sessionId) return;
      const url = $mirror.mirrorUrl(this.sessionId);
      QRCode.toCanvas(this.$refs.qrCanvas, url, { width: 220, margin: 1 }, (err) => {
        if (err) console.warn("[MirrorPanel] Falha ao gerar QR Code:", err);
      });
    },
    startPolling() {
      this.stopPolling();
      const poll = async () => {
        const info = await $mirror.fetchInfo();
        if (info) this.viewerCount = info.viewers;
      };
      poll();
      this.pollTimer = setInterval(poll, 5000);
    },
    stopPolling() {
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
    },
  },
  beforeUnmount() {
    this.stopPolling();
  },
};
</script>

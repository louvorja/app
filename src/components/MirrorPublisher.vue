<template>
  <!-- Sem interface: só observa o que está sendo projetado e publica no
       relay quando o espelhamento por QR Code está ativo. -->
  <span style="display: none" />
</template>

<script>
import { currentMirrorState } from "@/helpers/MirrorState";

export default {
  name: "MirrorPublisher",
  computed: {
    active() {
      return !!this.$userdata.get("mirror.session_id");
    },
    state() {
      return currentMirrorState();
    },
  },
  watch: {
    state: {
      deep: true,
      handler(value) {
        if (this.active) {
          this.$mirror.publish(value);
        }
      },
    },
    active(value) {
      if (value) {
        this.$mirror.publish(this.state);
      }
    },
  },
};
</script>

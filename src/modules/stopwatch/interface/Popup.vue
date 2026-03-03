<template>
  <div class="stopwatch-popup d-flex" :style="containerStyle">
    <div class="d-flex align-center justify-center flex-grow-1" :style="textStyle">
      {{ formattedTime }}
    </div>
  </div>
</template>

<script>
import manifest from "../manifest.json";

export default {
  name: "PopupStopwatchPage",
  data: () => ({
    elapsedTime: 0,
  }),
  computed: {
    module_id() {
      return manifest.id;
    },
    module() {
      return this.$modules.get(this.module_id);
    },
    userdata() {
      return new Proxy(
        {},
        {
          get: (_, key) => {
            return this.$userdata.get(`modules.${this.module.id}.${key}`, null);
          },
          set: (_, key, value) => {
            this.$userdata.set(`modules.${this.module.id}.${key}`, value);
            return true;
          },
        },
      );
    },
    backgroundColor() {
      return this.userdata.background_color || "#000000";
    },
    font() {
      return this.userdata.font || "Arial, sans-serif";
    },
    fontColor() {
      return this.userdata.font_color || "#FFFFFF";
    },
    fontSize() {
      return this.userdata.font_size || 30;
    },
    timeFormat() {
      return this.userdata.time_format || "hh.mm.ss.ms";
    },
    containerStyle() {
      return {
        background: this.backgroundColor,
        width: "100%",
        height: "100%",
      };
    },
    textStyle() {
      return {
        fontFamily: this.font,
        color: this.fontColor,
        fontSize: `${this.fontSize}px`,
      };
    },
    formattedTime() {
      const totalMilliseconds = this.elapsedTime;
      const hours = Math.floor(totalMilliseconds / 3600000);
      const minutes = Math.floor((totalMilliseconds % 3600000) / 60000);
      const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
      const milliseconds = Math.floor((totalMilliseconds % 1000) / 10);

      switch (this.timeFormat) {
        case "hh.mm.ss.ms":
          return `${hours.toString().padStart(2, "0")}.${minutes
            .toString()
            .padStart(2, "0")}.${seconds.toString().padStart(2, "0")}.${milliseconds
            .toString()
            .padStart(2, "0")}`;
        case "hh.mm.ss":
          return `${hours.toString().padStart(2, "0")}.${minutes
            .toString()
            .padStart(2, "0")}.${seconds.toString().padStart(2, "0")}`;
        case "mm.ss.ms":
          return `${minutes.toString().padStart(2, "0")}.${seconds
            .toString()
            .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
        case "mm.ss":
          return `${minutes.toString().padStart(2, "0")}.${seconds
            .toString()
            .padStart(2, "0")}`;
        default:
          return `${hours.toString().padStart(2, "0")}.${minutes
            .toString()
            .padStart(2, "0")}.${seconds.toString().padStart(2, "0")}.${milliseconds
            .toString()
            .padStart(2, "0")}`;
      }
    },
  },
  watch: {
    "userdata.savedTime": {
      immediate: true,
      handler(newVal) {
        this.elapsedTime = newVal || 0;
      },
    },
  },
  mounted() {
    // Carregar tempo inicial
    this.elapsedTime = this.userdata.savedTime || 0;
  },
};
</script>

<style scoped>
.stopwatch-popup {
  height: 100%;
}
</style>

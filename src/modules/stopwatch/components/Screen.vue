<template>
  <div
    ref="container"
    class="d-flex flex-column"
    :class="alignClass"
    :style="containerStyle"
  >
    <span class="text-right" :style="textStyle">
      {{ formattedTime }}
    </span>
  </div>
</template>

<script>
import manifest from "../manifest.json";

export default {
  name: "StopwatchPage",
  data: () => ({
    s_width: 0,
    s_height: 0,
    timer: null,
    elapsedTime: 0,
    isRunning: false,
    startTime: null,
    pausedTime: 0,
  }),
  expose: ['elapsedTime', 'formattedTime', 'start', 'pause', 'reset'],
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
    borderSpacing() {
      return this.userdata.border_spacing || 10;
    },
    verticalAlign() {
      return this.userdata.vertical_align || "center";
    },
    horizontalAlign() {
      return this.userdata.horizontal_align || "center";
    },
    image() {
      return this.userdata.image || "";
    },
    imageOpacity() {
      return (this.userdata.image_opacity || 100) / 100;
    },
    imageFit() {
      return this.userdata.image_fit || "cover";
    },
    timeFormat() {
      return this.userdata.time_format || "hh.mm.ss.ms";
    },
    alignClass() {
      const vertical = {
        start: "align-start",
        center: "align-center",
        end: "align-end",
      };
      const horizontal = {
        start: "justify-start",
        center: "justify-center",
        end: "justify-end",
      };
      return `${vertical[this.verticalAlign]} ${horizontal[this.horizontalAlign]}`;
    },
    containerStyle() {
      let style = {
        background: this.backgroundColor,
        width: "100%",
        height: "100%",
        color: this.fontColor,
        padding: `${this.borderSpacing}px`,
      };

      if (this.image) {
        style = {
          ...style,
          background: `
            linear-gradient(
              rgba(0, 0, 0, ${1 - this.imageOpacity}),
              rgba(0, 0, 0, ${1 - this.imageOpacity})
            ),
            url(${this.image})
          `,
          backgroundSize: this.imageFit,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        };
      }

      return style;
    },
    textStyle() {
      return {
        fontFamily: this.font,
        color: this.fontColor,
        fontSize: `${this.fontSizePc(this.fontSize)}px`,
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
  methods: {
    fontSizePc(pc) {
      const v = Math.min(this.s_width, this.s_height);
      return (pc * v) / 100 / 2;
    },
    windowResize() {
      const container = this.$refs.container;
      if (container) {
        this.s_width = container.offsetWidth;
        this.s_height = container.offsetHeight;

        if (this.s_width <= 0 || this.s_height <= 0) {
          const self = this;
          setTimeout(function () {
            self.windowResize();
          }, 100);
        }
      }
    },
    start() {
      if (!this.isRunning) {
        this.isRunning = true;
        this.startTime = Date.now() - this.pausedTime;
        this.timer = setInterval(() => {
          this.elapsedTime = Date.now() - this.startTime;
          // Salvar tempo em tempo real para o popup espelhar
          this.userdata.savedTime = this.elapsedTime;
        }, 10);
      }
    },
    pause() {
      if (this.isRunning) {
        this.isRunning = false;
        this.pausedTime = this.elapsedTime;
        clearInterval(this.timer);
      }
    },
    reset() {
      this.isRunning = false;
      this.elapsedTime = 0;
      this.startTime = null;
      this.pausedTime = 0;
      clearInterval(this.timer);
    },
  },
  mounted() {
    this.windowResize();
    window.addEventListener("resize", this.windowResize);
    
    // Carregar tempo salvo se houver
    const savedTime = this.userdata.savedTime;
    if (savedTime) {
      this.elapsedTime = savedTime;
      this.pausedTime = savedTime;
    }
  },
  unmounted() {
    window.removeEventListener("resize", this.windowResize);
    clearInterval(this.timer);
    
    // Salvar tempo ao desmontar
    this.userdata.savedTime = this.elapsedTime;
  },
};
</script>

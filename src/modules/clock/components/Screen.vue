<template>
  <div
    ref="container"
    class="d-flex"
    :class="alignClass"
    :style="containerStyle"
  >
    <span class="text-right" :style="textStyle">
      {{ time }}
    </span>
  </div>
</template>

<script>
import manifest from "../manifest.json";

export default {
  name: "ClockPage",
  data: () => ({
    s_width: 0,
    s_height: 0,
    timer: null,
    time: null,
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
      return this.userdata.time_format || "24h";
    },
    timeType() {
      return this.userdata.time_type || "hh.mm.ss";
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
    updateTime() {
      const now = new Date();
      let hours = now.getHours();
      const is12Hour = this.timeFormat === "12h";
      const displayHours = is12Hour && hours > 12 ? hours - 12 : (is12Hour && hours === 0 ? 12 : hours);
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");

      let timeStr = "";
      switch (this.timeType) {
        case "hh.mm.ss":
          timeStr = `${displayHours}.${minutes}.${seconds}`;
          break;
        case "hh.mm":
          timeStr = `${displayHours}.${minutes}`;
          break;
        case "hh":
          timeStr = `${displayHours}`;
          break;
        default:
          timeStr = `${displayHours}.${minutes}.${seconds}`;
      }

      if (is12Hour) {
        timeStr += hours >= 12 ? " PM" : " AM";
      }

      this.time = timeStr;
    },
  },
  mounted() {
    this.windowResize();
    window.addEventListener("resize", this.windowResize);
    this.updateTime();
    this.timer = setInterval(() => {
      this.updateTime();
    }, 1000);
  },
  unmounted() {
    window.removeEventListener("resize", this.windowResize);
    clearInterval(this.timer);
  },
};
</script>

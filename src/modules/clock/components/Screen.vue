<template>
  <div
    ref="container"
    class="d-flex"
    :class="alignClass"
    :style="containerStyle"
  >
    <img
      v-if="userdata.image"
      :src="userdata.image"
      :style="{
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        position: 'absolute',
        objectFit: userdata.image_fit,
        opacity: userdata.image_opacity / 100,
      }"
    />

    <div class="d-flex flex-column" :style="{ alignItems: alignItems }">
      <span :style="textStyle">
        {{ time }}
      </span>
      <span v-if="showDate" :style="dateStyle">
        {{ date }}
      </span>
    </div>
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
    date: null,
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
    hourCycle() {
      return this.userdata.hour_cycle || "24h";
    },
    timeFormat() {
      return this.userdata.time_format || "hh:mm:ss";
    },
    showDate() {
      return !!this.userdata.show_date;
    },
    alignItems() {
      return (
        { start: "flex-start", center: "center", end: "flex-end" }[
          this.horizontalAlign
        ] || "center"
      );
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
      return {
        background: this.backgroundColor,
        width: "100%",
        height: "100%",
        position: "relative",
        color: this.fontColor,
        padding: `${this.borderSpacing}px`,
      };
    },
    textStyle() {
      return {
        fontFamily: this.font,
        color: this.fontColor,
        zIndex: 1,
        fontSize: `${this.fontSizePc(this.fontSize)}px`,
        textAlign: `${this.horizontalAlign}`,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "0.03em",
        lineHeight: 1.1,
        textShadow: this.image
          ? "0 0.05em 0.15em rgba(0, 0, 0, 0.55)"
          : "none",
      };
    },
    dateStyle() {
      return {
        fontFamily: this.font,
        color: this.fontColor,
        zIndex: 1,
        opacity: 0.75,
        fontSize: `${this.fontSizePc(this.fontSize * 0.28)}px`,
        textAlign: `${this.horizontalAlign}`,
        textTransform: "capitalize",
        letterSpacing: "0.02em",
      };
    },
  },
  watch: {
    showDate() {
      this.updateTime();
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
      const is12Hour = this.hourCycle === "12h";
      const displayHours =
        is12Hour && hours > 12
          ? hours - 12
          : is12Hour && hours === 0
            ? 12
            : hours;
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      const pad = (v) => String(v).padStart(2, "0");

      const tokens = {
        hh: pad(displayHours),
        mm: pad(minutes),
        ss: pad(seconds),
      };

      let timeStr = this.timeFormat.replace(
        /hh|mm|ss/g,
        (match) => tokens[match],
      );

      if (is12Hour) {
        timeStr += hours >= 12 ? " PM" : " AM";
      }

      this.time = timeStr;

      if (this.showDate) {
        this.date = new Intl.DateTimeFormat(this.$i18n.locale, {
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(now);
      }
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

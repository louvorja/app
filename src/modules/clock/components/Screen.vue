<template>
  <div
    ref="container"
    class="d-flex align-center justify-center"
    :style="{
      background: config.background,
      width: '100%',
      height: height ? height + 'px' : '100%',
      color: config.textColor,
    }"
  >
    <span 
      class="text-right" 
      :style="{ 
        fontSize: config.fontSize ? config.fontSize + 'px' : '96px',
        fontFamily: config.fontFamily || 'Arial, sans-serif'
      }"
    >
      {{ time }}
    </span>
  </div>
</template>

<script>
export default {
  name: "ClockPage",
  props: {
    height: Number,
    config: {
      type: Object,
      default: () => ({
        format: 'hh:mm',
        background: '#000',
        textColor: '#fff',
        fontSize: 96,
        fontFamily: 'Arial, sans-serif',
      })
    },
  },
  data: () => ({
    s_width: 0,
    s_height: 0,
    timer: null,
    time: null,
  }),
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

        if (this.width <= 0 || this.height <= 0) {
          const self = this;
          setTimeout(function () {
            self.windowResize();
          }, 100);
        }
      }
    },
    getTimeFormat() {
      const format = this.config.format || 'hh:mm';
      const options = {};
      
      // Handle uppercase variants (H:mm, H:mm:ss)
      if (format.includes('H')) {
        options.hour = 'numeric';
      } else if (format.includes('hh') || format.includes('HH')) {
        options.hour = '2-digit';
      }
      
      if (format.includes('mm')) {
        options.minute = '2-digit';
      }
      if (format.includes('ss') && !format.includes('SS')) {
        options.second = '2-digit';
      }
      if (format.includes('SS')) {
        options.second = 'numeric';
      }
      
      return new Date().toLocaleTimeString('pt-BR', options);
    },
  },
  mounted() {
    this.windowResize();
    window.addEventListener("resize", this.windowResize);
    this.timer = setInterval(() => {
      this.time = this.getTimeFormat();
    });
  },
  unmounted() {
    window.removeEventListener("resize", this.windowResize);
    clearInterval(this.timer);
  },
};
</script>

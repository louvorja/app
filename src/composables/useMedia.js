import { watch } from "vue";
import $dev from "@/helpers/Dev";
import $appdata from "@/helpers/AppData";
import $userdata from "@/helpers/UserData";
import $datetime from "@/helpers/DateTime";
import $path from "@/helpers/Path";
import $alert from "@/helpers/Alert";
import $modules from "@/helpers/Modules";
import $database from "@/helpers/Database";
import $history from "@/helpers/History";
import $broadcast, { BROADCAST_TYPE } from "@/helpers/Broadcast";
import { useAudioPlayback } from "@/composables/useAudioPlayback";
import { useSlides } from "@/composables/useSlides";
import { useLyric } from "@/composables/useLyric";
import { useAlbum } from "@/composables/useAlbum";

const _audio = useAudioPlayback();
const _slides = useSlides();
const _lyric = useLyric();
const _album = useAlbum();
let _loadingId = null;

// Mantém $appdata sincronizado com o estado reativo de useSlides
// (Player.vue, Footer.vue e media/Index.vue ainda leem de $appdata)
watch(
  _slides.slideIndex,
  (si) => {
    $appdata.set("modules.media.config.slide_index", si);
  },
  { flush: "sync" }
);
watch(
  _slides.slideProgress,
  (sp) => {
    $appdata.set("modules.media.config.slide_progress", sp);
  },
  { flush: "sync" }
);
watch(
  _slides.totalSlides,
  (n) => {
    $appdata.set("modules.media.config.last_slide", n);
  },
  { flush: "sync" }
);

// Callback de timeUpdate: mantém $appdata de timing e fecha ao fim da música.
// O cálculo de slideIndex migrou para useSlides.bindAudio.
_audio.onTimeUpdate((ct, d) => {
  $appdata.set("modules.media.config.current_time", ct);
  $appdata.set("modules.media.config.duration", d);
  $appdata.set("modules.media.config.progress", _audio.progress.value);
  $appdata.set("modules.media.config.buffered", _audio.buffered.value);

  if (!_audio.isPaused.value && ct >= d && d > 0) {
    _self.close(true);
  }
});

function _buildSlidesFrom(data) {
  let prev_image = data?.url_image;
  let prev_image_position = data?.image_position;

  return [
    {
      lyric: data?.name,
      cover: true,
      time: "00:00:00",
      instrumental_time: "00:00:00",
      url_image: data?.url_image,
      image_position: data?.image_position,
    },
    ...Object.values(data?.lyric || {})
      .filter((lyric) => lyric.show_slide === 1)
      .sort((a, b) => a.order - b.order)
      .map((lyric) => {
        if (lyric.url_image) {
          prev_image = lyric.url_image;
          prev_image_position = lyric.image_position;
        }
        return {
          ...lyric,
          cover: false,
          lyric: lyric.lyric ? lyric.lyric.replace(/[\r\n]+/g, "<br>") : "",
          url_image: prev_image,
          image_position: prev_image_position,
        };
      }),
  ];
}

const _self = {
  async open(params) {
    if (typeof params != "object") {
      params = { id_music: params };
    }

    $dev.write("open media", params);

    // Conexão remota está ativada? Se sim, abre do programa desktop
    if ($userdata.get("remote.is_connected")) {
      const tag = params.mode == "audio" ? 1 : params.mode == "instrumental" ? 2 : 3;

      const url =
        $userdata.get("remote.url") +
        "/api/open-song?id=" +
        params.id_music +
        "&tag=" +
        tag +
        "&token=" +
        $userdata.get("remote.token");

      $alert.info("modules.media.alerts.open_remote");
      try {
        const response = await fetch(url, { method: "GET", mode: "cors" });
        const ret = await response.json();
        if (ret.status != "ok") {
          $alert.error({
            text:
              ret.code == "INVALID_TOKEN"
                ? "modules.remote_control.messages.invalid_token"
                : "modules.remote_control.messages.error",
            error: ret.code,
          });
        }
      } catch (error) {
        $alert.error({ text: "modules.media.alerts.open_remote_error", error });
      }
      return;
    }

    // Crossfade: se há audio tocando, faz fade out antes de carregar a nova música
    const _existingAudio = _audio.getElement();
    if (
      !_existingAudio.paused &&
      _existingAudio.src &&
      $userdata.get("modules.media.fade_audio", false)
    ) {
      await new Promise((resolve) => {
        _audio.fadeOut(() => {
          _audio.stop();
          resolve();
        });
      });
    } else {
      _audio.stop();
    }

    this.clearVariables();

    const id_music = params.id_music;
    const minimized = params.minimized ? params.minimized : false;
    const id_album = params.id_album ? params.id_album : null;
    let mode = params.mode ? params.mode : "no_audio";

    _loadingId = id_music;
    $appdata.set("modules.media.loading", true);

    let data = await $database.get(`music_${id_music}`);
    if (data == null || _loadingId !== id_music) {
      this.close(true);
      return;
    }
    $appdata.set("modules.media.data", data);
    $history.add(id_music, data.name, data.has_instrumental_music);

    $appdata.set("modules.media.id_music", id_music);
    $appdata.set("modules.media.id_album", id_album);
    $appdata.set("modules.media.config.title", data.name);
    this.setAlbumInfo(id_album);

    const slidesArray = _buildSlidesFrom(data);
    let timesArray = [];

    if (mode == "audio" || mode == "instrumental") {
      timesArray = slidesArray.map((item) =>
        $datetime.toNumber(mode == "audio" ? item.time : item.instrumental_time)
      );
    }

    _slides.setSlides(slidesArray, timesArray, data.name);

    $broadcast.send(BROADCAST_TYPE.SLIDES_DATA, {
      slides: slidesArray,
      title: data.name,
      slide_index: 0,
    });

    if (minimized) {
      this.minimize();
    } else {
      this.maximize();
    }

    if (mode == "audio" || mode == "instrumental") {
      const volume = $appdata.get("modules.media.config.volume");
      _audio.setVolume(volume);
      _audio.getElement().currentTime = 0;
      $appdata.set("modules.media.config.is_paused", true);

      const audioUrl = $path.file(mode == "audio" ? data.url_music : data.url_instrumental_music);
      $appdata.set("modules.media.config.audio", audioUrl);

      _slides.bindAudio(_audio);

      if ($appdata.get("is_online") && $userdata.get("modules.media.lazy_load")) {
        $appdata.set("modules.media.config.lazy", true);
        _audio.setSrc(audioUrl, true);
        $appdata.set("modules.media.loading", false);
        this.pause(false);
      } else {
        $appdata.set("modules.media.config.lazy", false);
        const self = this;
        let request = new XMLHttpRequest();
        try {
          request.open("GET", audioUrl, true);
        } catch (error) {
          $appdata.set("modules.media.loading", false);
          self.close(true);
          $alert.error({ text: "modules.media.alerts.not_loaded", error }, function (a) {
            if (a) self.open(id_music);
          });
          return;
        }

        request.responseType = "blob";
        request.onload = function () {
          if (_loadingId !== id_music) return;
          if (this.status == 200) {
            _audio.setSrc(URL.createObjectURL(this.response), false);
            self.pause(false);
          } else {
            self.close(true);
            $alert.error(
              { text: "modules.media.alerts.not_loaded", error: request.statusText || "" },
              function (a) {
                if (a) self.open(id_music);
              }
            );
          }
        };
        request.onerror = function () {
          if (_loadingId !== id_music) return;
          self.close(true);
          $alert.error(
            { text: "modules.media.alerts.not_loaded", error: request.statusText || "" },
            function (a) {
              if (a) self.open(id_music);
            }
          );
        };

        request.send();
        $appdata.set("modules.media.loading", false);
      }
    } else {
      $appdata.set("modules.media.config.audio", "");
      $appdata.set("modules.media.loading", false);
      // Modo sem áudio: broadcast imediato do slide de capa para a projeção
      _slides.broadcastSlide();
    }

    $appdata.set("modules.media.config.mode", mode);
  },

  close(force = false) {
    if (!force) {
      const self = this;
      $alert.yesno("modules.media.alerts.close", function (btn) {
        if (btn == "yes") self.close(true);
      });
      return;
    }

    _audio.stop();
    this.clearVariables();
    $appdata.set("modules.media.show", false);
    $appdata.set("modules.media.minimized", false);
  },

  async openLyric(params) {
    if (params == null || params == undefined) {
      params = {
        id_music: $appdata.get("modules.media.id_music"),
        id_album: $appdata.get("modules.media.id_album"),
      };
    } else if (typeof params != "object") {
      params = { id_music: params };
    }

    const ok = await _lyric.open(params);
    if (!ok) {
      this.closeLyric();
      return;
    }

    $appdata.set("modules.lyric.show", true);
  },
  closeLyric() {
    _lyric.close();
    $appdata.set("modules.lyric.show", false);
  },

  async openAlbum(id_album) {
    const { redirect } = await _album.open(id_album);
    if (redirect) $modules.open(redirect);
  },
  closeAlbum() {
    _album.close();
  },

  async openAudio(params) {
    if (typeof params != "object") {
      params = { id_music: params };
    }
    $dev.write("open audio", params);

    const id_music = params.id_music;
    let mode = params.mode ? params.mode : "audio";

    $appdata.set("loading", true);

    let data = await $database.get(`music_${id_music}`);
    if (data == null) {
      $appdata.set("loading", false);
      return;
    }

    const url = mode == "instrumental" ? data.url_instrumental_music : data.url_music;
    window.open($path.file(url), "_blank", "noopener,noreferrer");

    $appdata.set("loading", false);
  },

  clearVariables() {
    _slides.reset();
    _audio.reset();
    $appdata.set("modules.media.data", {});
    $appdata.set("modules.media.id_music", null);
    $appdata.set("modules.media.config.title", "");
    $appdata.set("modules.media.config.subtitle", "");
    $appdata.set("modules.media.config.track", 0);
    $appdata.set("modules.media.config.image", "");
    $appdata.set("modules.media.config.audio", "");
    $appdata.set("modules.media.config.lazy", false);
    $appdata.set("modules.media.config.current_time", 0);
    $appdata.set("modules.media.config.duration", 0);
    $appdata.set("modules.media.config.progress", 0);
    $appdata.set("modules.media.config.volume", 100);
    $appdata.set("modules.media.config.is_paused", false);
    $appdata.set("modules.media.config.is_fading", false);
  },

  minimize() {
    $appdata.set("modules.media.show", false);
    $appdata.set("modules.media.minimized", true);
  },

  maximize() {
    $appdata.set("modules.media.show", true);
    $appdata.set("modules.media.minimized", false);
  },

  isMinimized() {
    return $appdata.get("modules.media.minimized", false);
  },

  isLoading() {
    return $appdata.get("modules.media.loading", false);
  },

  config() {
    return $appdata.get("modules.media.config");
  },

  slides() {
    return _slides.slides.value;
  },

  slide() {
    return _slides.slide.value;
  },

  broadcastSlide() {
    _slides.broadcastSlide();
  },

  goToSlide(index) {
    _slides.goToSlide(index);
  },
  goToTime(time) {
    _audio.seekTo(time);
  },
  advanceTime(time = 10) {
    if (_audio.duration.value > 0 && $appdata.get("modules.media.config.audio") != "") {
      _audio.advanceTime(time);
    }
  },

  play() {
    this.pause(false);
  },
  pause(bool = true, callback) {
    const fade_audio = $userdata.get("modules.media.fade_audio", false);

    if (bool) {
      if (fade_audio) {
        _audio.fadeOut(() => {
          _audio.pause(callback);
          $appdata.set("modules.media.config.is_paused", true);
          $appdata.set("modules.media.config.is_fading", false);
        });
      } else {
        _audio.pause(callback);
        $appdata.set("modules.media.config.is_paused", true);
      }
    } else {
      const self = this;
      _audio.play((e) => {
        $alert.error({ text: "modules.media.alerts.not_loaded", error: e || "" }, function (a) {
          if (a) self.open($appdata.get("modules.media.id_music"));
        });
      });
      if (fade_audio) {
        _audio.fadeIn($appdata.get("modules.media.config.volume"), () => {
          $appdata.set("modules.media.config.is_fading", false);
          if (callback) callback();
        });
        $appdata.set("modules.media.config.is_fading", true);
      } else {
        _audio.setVolume($appdata.get("modules.media.config.volume"));
        if (callback) callback();
      }
      $appdata.set("modules.media.config.is_paused", false);
    }
  },

  firstSlide() {
    _slides.goFirst();
  },
  prevSlide() {
    _slides.goPrev();
  },
  nextSlide() {
    _slides.goNext();
  },
  lastSlide() {
    _slides.goLast();
  },
  setVolume(val) {
    _audio.setVolume(val);
    $appdata.set("modules.media.config.volume", val);
  },
  toogleVolume() {
    const volume = $appdata.get("modules.media.config.volume");
    this.setVolume(volume < 100 ? 100 : 0);
  },

  fullscreen(value = true) {
    $appdata.set("modules.media.config.fullscreen", value);
  },

  setAlbumInfo(id_album, module = "media") {
    _album.setAlbumInfo(id_album, module);
  },
};

export default _self;

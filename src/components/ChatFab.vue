<template>
  <!-- Sidebar Chat Module (non-floating) -->
  <v-navigation-drawer
    v-model="isOpen"
    temporary
    location="right"
    width="380"
    class="louvorj-drawer"
  >
    <!-- Header -->
    <div class="lj-panel__header" :style="headerStyle">
      <div class="lj-panel__avatar-wrap">
        <img :src="botAvatar" alt="LouvorJ.AI" class="lj-panel__avatar" />
        <span class="lj-panel__status-dot"></span>
      </div>
      <div class="lj-panel__info">
        <span class="lj-panel__name">{{ $t("chatbot.name") }}</span>
        <span class="lj-panel__status">{{ $t("chatbot.status") }}</span>
      </div>
      <div class="lj-panel__actions">
        <button class="lj-panel__btn" @click="clearChat" :title="$t('chatbot.new_conversation')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35A7.96 7.96 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Messages -->
    <div ref="messagesArea" class="lj-panel__messages" :style="messagesStyle" @click="handleMessageClick">
      <div class="lj-date" v-if="messages.length === 0 && !isTyping">
        {{ currentDate }}
      </div>

      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="lj-msg"
        :class="{ 'lj-msg--user': msg.role === 'user' }"
      >
        <div class="lj-msg__avatar" :class="`lj-msg__avatar--${msg.role}`">
          <img v-if="msg.role === 'bot'" :src="botAvatar" alt="Bot" />
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M12 4a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z"/>
          </svg>
        </div>
        <div class="lj-msg__body">
          <div class="lj-bubble" :class="{ 'lj-bubble--user': msg.role === 'user' }" :style="msg.role === 'user' ? userBubbleStyle : botBubbleStyle" v-html="msg.text" />
          <div class="lj-bubble__meta" :class="{ 'lj-bubble__meta--dark': isDark }">
            <span class="lj-bubble__time">{{ msg.time }}</span>
            <svg v-if="msg.role === 'bot'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lj-check">
              <path d="M18 6L7 17l-5-5"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Typing indicator -->
      <div v-if="isTyping" class="lj-msg">
        <div class="lj-msg__avatar lj-msg__avatar--bot">
          <img :src="botAvatar" alt="Bot" />
        </div>
        <div class="lj-msg__body">
          <div class="lj-bubble lj-bubble--bot" :style="botBubbleStyle">
            <div class="lj-typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Replies -->
      <div v-if="messages.length === 1 && !isTyping && showQuickReplies" class="lj-quick-replies">
        <button
          v-for="(qr, qi) in quickReplies"
          :key="qi"
          class="lj-quick-reply"
          :style="quickReplyStyle"
          @click="sendQuickReply(qr.text)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {{ qr.label }}
        </button>
      </div>
    </div>

    <!-- Input -->
    <div class="lj-panel__input" :class="{ 'lj-panel__input--dark': isDark }" :style="inputStyle">
      <textarea
        ref="inputField"
        v-model="inputText"
        class="lj-input"
        :class="{ 'lj-input--dark': isDark }"
        :placeholder="$t('chatbot.placeholder')"
        rows="1"
        @keydown.enter.exact.prevent="sendMessage"
        @input="autoResize"
      />
      <button
        class="lj-send"
        :class="{ 'lj-send--active': inputText.trim() }"
        :disabled="!inputText.trim() || isTyping"
        :style="sendBtnStyle"
        @click="sendMessage"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
  </v-navigation-drawer>

  <!-- Toolbar button to open the chat -->
  <v-btn
    icon
    variant="text"
    size="small"
    class="louvorj-chat-trigger"
    :title="isOpen ? $t('chatbot.close') : $t('chatbot.open')"
    @click="toggle"
  >
    <v-badge v-if="!isOpen && unreadCount > 0" :content="unreadCount" color="error" location="top-end" dot />
    <img :src="botAvatar" alt="LouvorJ.AI" class="louvorj-chat-trigger__icon" />
  </v-btn>
</template>

<script>
import { useTheme } from "vuetify";

// Módulos que o assistente pode abrir diretamente (id real do módulo no app).
const MODULE_INTENTS = [
  { id: "bible", keywords: ["abrir biblia", "abrir bíblia", "abra a biblia", "abra a bíblia"] },
  { id: "liturgy", keywords: ["abrir liturgia", "abra a liturgia", "quadro da liturgia", "abrir o quadro"] },
  { id: "musics", keywords: ["abrir musicas", "abrir músicas", "lista de musicas", "lista de músicas"] },
  { id: "hymnal", keywords: ["abrir hinario", "abrir hinário"] },
  { id: "hymnal_1996", keywords: ["hinario 1996", "hinário 1996"] },
  { id: "collections", keywords: ["abrir coletaneas", "abrir coletâneas", "abrir albuns", "abrir álbuns"] },
  { id: "theme", keywords: ["abrir temas", "mudar tema", "trocar cor", "mudar cor"] },
  { id: "clock", keywords: ["abrir relogio", "abrir relógio"] },
  { id: "stopwatch", keywords: ["abrir cronometro", "abrir cronômetro"] },
  { id: "remote_control", keywords: ["controle remoto", "conectar no desktop"] },
];

// Base de conhecimento com apenas recursos que realmente existem no LouvorJA.
const KNOWLEDGE = [
  {
    keywords: ["atalho", "tecla", "shortcut", "teclado", "espaco", "espaço"],
    text: "Atalhos do LouvorJA durante a reprodução de uma música:<br>&#8226; <strong>Espaço</strong> — pausar/reproduzir<br>&#8226; <strong>Home</strong> / <strong>End</strong> — primeiro/último slide<br>&#8226; <strong>Setas</strong> ou <strong>PageUp/PageDown</strong> — slide anterior/próximo<br>&#8226; <strong>Ctrl+Setas</strong> — avança/retrocede 10s no áudio<br>Na Bíblia: <strong>Setas</strong> muda de versículo e <strong>Del</strong> limpa a seleção.",
  },
  {
    keywords: ["segunda tela", "projet", "monitor", "projetor", "tv", "tela cheia", "expandida"],
    text: "Para exibir a projeção pública numa segunda tela (projetor ou TV conectada ao computador), use o botão <strong>\"Tela de Projeção\"</strong> no cabeçalho do programa (ícone de monitores). Ele detecta as telas conectadas e você escolhe qual deve receber a exibição — a escolha fica salva.",
  },
  {
    keywords: ["letra", "cifra", "acorde", "cantado", "playback", "sem audio", "sem áudio"],
    text: "Cada música pode ser aberta de formas diferentes pelo menu ao lado do nome: <strong>Cantado</strong> (com áudio original), <strong>Playback</strong> (instrumental, se disponível) <strong>Sem Áudio</strong> (slide manual) ou apenas a <strong>Letra</strong>.",
  },
  {
    keywords: ["coleç", "colecoes", "coletanea", "coletânea", "playlist", "album", "álbum", "albuns", "álbuns"],
    text: "As <strong>Coletâneas</strong> organizam os álbuns por categoria. Posso abrir esse módulo para você — é só pedir.",
  },
  {
    keywords: ["bibl", "versíc", "versic", "passage"],
    text: "A busca bíblica fica no módulo <strong>Bíblia</strong>: escolha livro, capítulo e versão, marque os versículos desejados e use as setas do teclado para navegar rapidamente entre eles.",
  },
  {
    keywords: ["liturg", "culto", "programaç", "programacao", "agenda", "escala", "kanban"],
    text: "O módulo <strong>Liturgia</strong> organiza a programação do culto num quadro por dia da semana (Segunda a Domingo). Crie colunas para as partes do culto (ex: Abertura, Louvor, Palavra, Encerramento) e adicione cards de música, versículo, link ou mídia com antecedência — no dia do culto é só clicar em \"Reproduzir\" em cada card.",
  },
  {
    keywords: ["hinari", "hinário", "hino adventista"],
    text: "O LouvorJA traz dois hinários: <strong>Hinário Adventista</strong> e <strong>Hinário Adventista 1996</strong>. Em cada um, digite o número da faixa ou o nome do hino na busca.",
  },
  {
    keywords: ["tema", "cor", "cores", "aparência", "aparencia", "escuro", "claro"],
    text: "Para mudar as cores do programa, abra o menu lateral (ícone ☰) e escolha <strong>Temas</strong>.",
  },
  {
    keywords: ["idioma", "espanhol", "espanol", "português", "portugues", "español", "language"],
    text: "O LouvorJA está disponível em Português e Espanhol. Troque o idioma pela bandeira no canto superior direito do cabeçalho.",
  },
  {
    keywords: ["controle remoto", "remoto", "conectar desktop", "conectar no desktop"],
    text: "O <strong>Controle Remoto</strong> conecta este navegador a um LouvorJA rodando em outro computador (aplicativo desktop) para acionar músicas remotamente. É preciso informar o IP e o token exibidos no programa desktop para conectar.",
  },
  {
    keywords: ["baixar", "instalar", "download", "app", "celular", "pwa", "aplicativo"],
    text: "O LouvorJA roda direto no navegador e pode ser instalado como aplicativo (PWA) — no Chrome ou Edge, procure a opção \"Instalar app\" na barra de endereço.",
  },
];

const QUICK_REPLIES = [
  { label: "Buscar música", text: "Quero buscar uma música" },
  { label: "Hinário", text: "Buscar no hinário" },
  { label: "Abrir Liturgia", text: "Abrir liturgia" },
  { label: "Tela de projeção", text: "Como uso a segunda tela?" },
  { label: "Atalhos", text: "Quais são os atalhos do LouvorJA?" },
];

export default {
  name: "ChatFab",
  setup() {
    const theme = useTheme();
    return { theme };
  },
  data: () => ({
    isOpen: false,
    messages: [],
    inputText: "",
    isTyping: false,
    welcomeShown: false,
    unreadCount: 0,
    showQuickReplies: false,
    quickReplies: QUICK_REPLIES,
    musicIndex: null,
    categories: null,
    hymnalData: null,
    musicLoaded: false,
  }),
  computed: {
    botAvatar() {
      return new URL("@/assets/imgs/chatbot-avatar.jpg", import.meta.url).href;
    },
    locale() {
      return this.$i18n?.locale || "pt";
    },
    isDark() { return !!this.theme?.global?.current?.value?.dark; },
    primaryColor() {
      try { return this.theme?.global?.current?.value?.colors?.primary || "#1b2a41"; }
      catch { return "#1b2a41"; }
    },
    headerStyle() {
      return {
        background: `linear-gradient(135deg, ${this.primaryColor}, ${this.darken(this.primaryColor, 15)})`,
        color: "white",
      };
    },
    userBubbleStyle() {
      return { background: this.primaryColor, color: "white" };
    },
    botBubbleStyle() {
      return {
        background: this.isDark ? "rgba(255,255,255,0.08)" : "white",
        color: this.isDark ? "rgba(255,255,255,0.87)" : "#333",
        boxShadow: this.isDark ? "none" : "0 1px 3px rgba(0,0,0,0.06)",
      };
    },
    messagesStyle() {
      return {
        background: this.isDark
          ? "#121212"
          : "rgb(var(--v-theme-surface-variant, 240,240,240))",
      };
    },
    inputStyle() {
      return {
        background: this.isDark ? "#1e1e1e" : "white",
        borderTopColor: this.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      };
    },
    quickReplyStyle() {
      return { borderColor: this.primaryColor, color: this.primaryColor };
    },
    sendBtnStyle() {
      return { backgroundColor: this.primaryColor };
    },
    currentDate() {
      return new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
    },
  },
  methods: {
    darken(hex, percent) {
      const h = hex.replace("#", "");
      const r = Math.max(0, parseInt(h.substring(0, 2), 16) - Math.round(255 * percent / 100));
      const g = Math.max(0, parseInt(h.substring(2, 4), 16) - Math.round(255 * percent / 100));
      const b = Math.max(0, parseInt(h.substring(4, 6), 16) - Math.round(255 * percent / 100));
      return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
    },
    getCurrentTime() {
      return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    },
    toggle() { this.isOpen ? this.close() : this.open(); },
    open() {
      this.isOpen = true;
      this.unreadCount = 0;
      this.$nextTick(() => {
        this.showWelcome();
        this.scrollToBottom();
        if (this.$refs.inputField) this.$refs.inputField.focus();
      });
      if (!this.musicLoaded) { this.musicLoaded = true; this.fetchMusicIndex().catch(() => {}); }
    },
    close() { this.isOpen = false; this.showQuickReplies = false; },
    async sendMessage() {
      const text = this.inputText.trim();
      if (!text || this.isTyping) return;
      this.messages.push({ role: "user", text: this.escapeHtml(text), time: this.getCurrentTime() });
      this.showQuickReplies = false;
      this.inputText = "";
      this.$nextTick(() => {
        this.scrollToBottom();
        if (this.$refs.inputField) this.$refs.inputField.style.height = "auto";
      });
      this.isTyping = true;
      this.$nextTick(() => this.scrollToBottom());
      try {
        const resp = await this.generateBotResponse(text);
        this.isTyping = false;
        this.messages.push({ role: "bot", text: resp.text, time: this.getCurrentTime() });
        if (!this.isOpen) this.unreadCount++;
        this.$nextTick(() => {
          this.scrollToBottom();
          if (this.messages.length <= 2) this.showQuickReplies = true;
        });
      } catch {
        this.isTyping = false;
        this.messages.push({ role: "bot", text: this.$t("chatbot.error"), time: this.getCurrentTime() });
        this.scrollToBottom();
      }
    },
    sendQuickReply(text) { this.inputText = text; this.sendMessage(); },
    detectOpenModule(text) {
      for (const m of MODULE_INTENTS) {
        if (m.keywords.some((kw) => text.includes(kw))) return m.id;
      }
      return null;
    },
    detectIntent(text) {
      const t = text.toLowerCase();
      const isSearch = t.includes("buscar") || t.includes("procurar") || t.includes("achar") || t.includes("encontrar");
      const isMusic = t.includes("música") || t.includes("musica") || t.includes("hino") || t.includes("som") || t.includes("louvor");
      const isCollection = t.includes("coleção") || t.includes("colecoes") || t.includes("coletanea") || t.includes("coletânea") || t.includes("playlist") || t.includes("album") || t.includes("álbum") || t.includes("albuns") || t.includes("álbuns");
      if (isSearch && isMusic) return "music_search";
      if (t.includes("hinari") || t.includes("hino adventista") || (/\d/.test(t) && !isCollection && isMusic)) return "hymnal_search";
      if (isCollection) return "categories";
      return "knowledge";
    },
    async generateBotResponse(userText) {
      const text = userText.toLowerCase();

      const moduleId = this.detectOpenModule(text);
      if (moduleId) return this.openModule(moduleId);

      const intent = this.detectIntent(text);
      switch (intent) {
        case "music_search": return await this.handleMusicSearch(text);
        case "hymnal_search": return await this.handleHymnalSearch(text);
        case "categories": return await this.handleCategories();
        default: {
          const local = this.handleKnowledge(text);
          if (local) return local;
          return {
            text: this.$t("chatbot.guardrail"),
          };
        }
      }
    },
    openModule(id) {
      this.$modules.open(id);
      return { text: this.$t("chatbot.opening_module") };
    },
    async fetchMusicIndex() {
      if (this.musicIndex) return;
      try {
        this.musicIndex = await this.$database.get(`${this.locale}_musics`);
      } catch (e) { console.warn("[ChatFab] Failed to load music index:", e); }
    },
    async fetchCategories() {
      if (this.categories) return this.categories;
      try {
        this.categories = await this.$database.get(`${this.locale}_categories`);
        return this.categories;
      } catch (e) { console.warn("[ChatFab] Failed to load categories:", e); }
      return null;
    },
    async fetchHymnal() {
      if (this.hymnalData) return this.hymnalData;
      try {
        this.hymnalData = await this.$database.get(`${this.locale}_hymnal`);
        return this.hymnalData;
      } catch (e) { console.warn("[ChatFab] Failed to load hymnal:", e); }
      return null;
    },
    async handleMusicSearch(query) {
      await this.fetchMusicIndex();
      const arr = Array.isArray(this.musicIndex) ? this.musicIndex : (this.musicIndex?.data || []);
      if (!arr.length) return { text: "Não consegui carregar o índice de músicas. Tente novamente." };
      const q = query.replace(/quero|gostaria de|buscar|procurar|hino|som|louvor|sobre|música|musica/gi, "").trim();
      if (!q) return { text: "Digite o nome ou parte do nome da música que deseja buscar." };
      const results = arr.filter((m) => (m.name || "").toLowerCase().includes(q)).slice(0, 8);
      if (!results.length) return { text: `Não encontrei resultados para "<strong>${this.escapeHtml(q)}</strong>". Tente outro termo!` };
      return { text: `Encontrei <strong>${results.length}</strong> resultado(s), toque para reproduzir:${this.renderMusicResults(results)}` };
    },
    async handleHymnalSearch(query) {
      const data = await this.fetchHymnal();
      const arr = Array.isArray(data) ? data : (data?.data || []);
      if (!arr.length) return { text: "Não consegui carregar o hinário. Tente novamente." };
      const q = query.replace(/buscar|hin[aá]rio|hino|adventista|1996|n[uú]mero|numero|no|na/g, "").trim();
      const num = parseInt(q, 10);
      let results;
      if (!isNaN(num) && num > 0) results = arr.filter((h) => String(h.track || "") === String(num));
      else if (q) results = arr.filter((h) => (h.name || "").toLowerCase().includes(q));
      else results = arr.slice(0, 10);
      if (!results.length) return { text: "Não encontrei esse hino. Tente digitar o número da faixa ou o nome!" };
      return { text: `Hinário — <strong>${results.length}</strong> resultado(s), toque para reproduzir:${this.renderMusicResults(results, true)}` };
    },
    async handleCategories() {
      const data = await this.fetchCategories();
      const arr = Array.isArray(data) ? data : (data?.data || []);
      this.$modules.open("collections");
      if (!arr.length) return { text: "Abri o módulo de Coletâneas para você." };
      const html = arr
        .slice()
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((c) => `<div class="lj-search-item"><div class="lj-search-item__name">${this.escapeHtml(c.name || "Sem nome")}</div></div>`)
        .join("");
      return { text: `Abri o módulo de <strong>Coletâneas</strong>. Categorias disponíveis:<div class="lj-search-results">${html}</div>` };
    },
    renderMusicResults(results, showTrack = false) {
      const html = results
        .map((m) => {
          const parts = [showTrack && m.track ? `Faixa ${m.track}` : null, this.$datetime.shortTime(m.duration)].filter(Boolean);
          return `<div class="lj-search-item lj-search-item--playable" data-id-music="${m.id_music}"><div class="lj-search-item__name">${this.escapeHtml(m.name || "Sem título")}</div><div class="lj-search-item__info">${this.escapeHtml(parts.join(" • ") || "—")}</div></div>`;
        })
        .join("");
      return `<div class="lj-search-results">${html}</div>`;
    },
    handleMessageClick(event) {
      const item = event.target.closest("[data-id-music]");
      if (!item) return;
      const id_music = Number(item.dataset.idMusic);
      if (id_music) this.$media.open({ id_music, mode: "audio" });
    },
    handleKnowledge(userText) {
      for (const k of KNOWLEDGE) {
        if (k.keywords.some((kw) => userText.includes(kw))) return { text: k.text };
      }
      return null;
    },
    escapeHtml(text) {
      const d = document.createElement("div");
      d.textContent = text;
      return d.innerHTML;
    },
    autoResize() {
      const el = this.$refs.inputField;
      if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 100) + "px"; }
    },
    scrollToBottom() {
      const a = this.$refs.messagesArea;
      if (a) a.scrollTop = a.scrollHeight;
    },
    clearChat() {
      this.messages = [];
      this.welcomeShown = false;
      this.showQuickReplies = false;
      this.$nextTick(() => this.showWelcome());
    },
    showWelcome() {
      if (this.welcomeShown) return;
      this.welcomeShown = true;
      this.messages.push({
        role: "bot",
        text: this.$t("chatbot.welcome"),
        time: this.getCurrentTime(),
      });
    },
  },
};
</script>

<style scoped>
/* ========== DRAWER OVERRIDE ========== */
.louvorj-drawer {
  z-index: 2400 !important;
}
.louvorj-drawer :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
  padding: 0 !important;
  overflow: hidden;
  height: 100%;
}

/* ========== TRIGGER BUTTON ========== */
.louvorj-chat-trigger {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.louvorj-chat-trigger:hover {
  transform: scale(1.05);
}
.louvorj-chat-trigger:active {
  transform: scale(0.95);
}
.louvorj-chat-trigger__icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

/* ========== PANEL HEADER ========== */
.lj-panel__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  transition: background 0.4s ease;
  flex-shrink: 0;
}
.lj-panel__avatar-wrap { position: relative; flex-shrink: 0; }
.lj-panel__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255,255,255,0.3);
}
.lj-panel__status-dot {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 10px;
  height: 10px;
  background: #2ECC71;
  border-radius: 50%;
  border: 2px solid transparent;
}
.lj-panel__info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.lj-panel__name { font-size: 14px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lj-panel__status { font-size: 11px; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lj-panel__actions { display: flex; gap: 4px; flex-shrink: 0; }

.lj-panel__btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.15);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  padding: 0;
}
.lj-panel__btn:hover { background: rgba(255,255,255,0.25); }

/* ========== MESSAGES AREA ========== */
.lj-panel__messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: background 0.4s ease;
}
.lj-panel__messages::-webkit-scrollbar { width: 4px; }
.lj-panel__messages::-webkit-scrollbar-track { background: transparent; }
.lj-panel__messages::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.3); border-radius: 4px; }

.lj-date {
  text-align: center;
  font-size: 11px;
  opacity: 0.6;
  padding: 6px 0;
  transition: color 0.4s ease;
}
.lj-panel__messages:not(.lj-panel__messages--dark) .lj-date { color: #666; }

/* ========== MESSAGE ========== */
.lj-msg {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  max-width: 85%;
}
.lj-msg--user { align-self: flex-end; flex-direction: row-reverse; }

.lj-msg__avatar {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
.lj-msg__avatar--bot { width: 32px; height: 32px; min-width: 32px; }
.lj-msg__avatar--bot img { width: 100%; height: 100%; object-fit: cover; }
.lj-msg__avatar--user {
  width: 28px;
  height: 28px;
  min-width: 28px;
  background: var(--current-primary, #1b2a41);
}

.lj-msg__body { display: flex; flex-direction: column; min-width: 0; }

/* ========== BUBBLE ========== */
.lj-bubble {
  padding: 10px 14px;
  font-size: 13.5px;
  line-height: 1.55;
  word-wrap: break-word;
  overflow-wrap: break-word;
  transition: background 0.4s ease, color 0.4s ease;
}
.lj-bubble--bot { border-radius: 16px 16px 16px 4px; }
.lj-bubble--user { border-radius: 16px 16px 4px 16px; }

.lj-bubble__meta { padding: 2px 4px; }
.lj-bubble__time { font-size: 10px; opacity: 0.5; }
.lj-bubble__meta--dark .lj-bubble__time { color: rgba(255,255,255,0.5); }
.lj-msg--user .lj-bubble__meta { text-align: right; }
.lj-check { opacity: 0.5; }

/* ========== TYPING ========== */
.lj-typing { display: flex; align-items: center; gap: 4px; padding: 4px 0; }
.lj-typing span {
  width: 7px; height: 7px;
  opacity: 0.4; border-radius: 50%;
  animation: typingBounce 1.4s infinite ease-in-out;
  background: currentColor;
}
.lj-typing span:nth-child(2) { animation-delay: 0.2s; }
.lj-typing span:nth-child(3) { animation-delay: 0.4s; }

/* ========== QUICK REPLIES ========== */
.lj-quick-replies {
  display: flex; flex-wrap: wrap; gap: 6px; padding: 4px 0;
}
.lj-quick-reply {
  cursor: pointer; background: none; border: 1.5px solid;
  border-radius: 20px; padding: 6px 14px; font-size: 12px;
  font-family: inherit; display: flex; align-items: center; gap: 4px;
  transition: background 0.2s, transform 0.15s;
}
.lj-quick-reply:hover { opacity: 0.85; transform: translateY(-1px); }

/* ========== INPUT ========== */
.lj-panel__input {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 14px; border-top: 1px solid;
  transition: background 0.4s ease, border-color 0.4s ease;
  flex-shrink: 0;
}
.lj-input {
  flex: 1; border: 1.5px solid transparent;
  border-radius: 22px; padding: 10px 16px;
  resize: none; outline: none; font-family: inherit;
  font-size: 13.5px; max-height: 100px; line-height: 1.4;
  transition: border-color 0.2s, background 0.2s;
}
.lj-input:not(.lj-input--dark) { background: #f0f0f0; color: #333; }
.lj-input:not(.lj-input--dark):focus { background: white; }
.lj-input--dark { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.87); }
.lj-input--dark:focus { background: rgba(255,255,255,0.1); }
.lj-input::placeholder { opacity: 0.5; }

.lj-send {
  width: 36px; height: 36px; min-width: 36px; border-radius: 50%;
  border: none; cursor: pointer; display: flex;
  align-items: center; justify-content: center;
  padding: 0; transition: all 0.2s; opacity: 0.5;
}
.lj-send--active { opacity: 1; }
.lj-send:disabled { cursor: not-allowed; opacity: 0.3; }

/* ========== ANIMATIONS ========== */
@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-5px); opacity: 1; }
}

/* ========== SEARCH RESULTS ========== */
.lj-search-results {
  margin-top: 8px; display: flex; flex-direction: column;
  gap: 4px; max-height: 240px; overflow-y: auto;
}
.lj-search-item {
  padding: 8px 10px; background: rgba(0,0,0,0.03);
  border-radius: 8px; transition: background 0.2s;
}
.lj-search-item--playable { cursor: pointer; }
.lj-search-item:hover { background: rgba(0,0,0,0.06); }
.lj-search-item__name { font-size: 13px; font-weight: 600; color: #333; }
.lj-search-item__info { font-size: 11px; color: #888; margin-top: 2px; }
.lj-bubble--user + .lj-bubble__meta,
.lj-bubble--user ~ .lj-bubble__meta {
  display: flex; justify-content: flex-end;
}

/* ========== MOBILE RESPONSIVE ========== */
@media (max-width: 480px) {
  .louvorj-chat-trigger { bottom: 16px; right: 16px; width: 44px; height: 44px; }
  .lj-msg { max-width: 90%; }
}
</style>

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
    <div ref="messagesArea" class="lj-panel__messages" :style="messagesStyle">
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
          <div v-if="msg.sources && msg.sources.length" class="lj-sources" :class="{ 'lj-sources--dark': isDark }">
            <div v-for="(s, si) in msg.sources" :key="si" class="lj-sources__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <span>{{ s }}</span>
            </div>
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
      <input type="file" ref="fileInput" accept=".txt,.md,.pdf,.pptx,.ja" style="display:none" @change="handleFileUpload" />
      <button class="lj-attach-btn" :style="{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }" @click="$refs.fileInput.click()" :title="$t('chatbot.send_file')">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lj-attach-icon">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </svg>
      </button>
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
import { buildSystemPrompt } from "@/utils/chatbot-rag";

// API_TOKEN removed from frontend — move to backend/.env

const KNOWLEDGE = [
  {
    keywords: ["atalho", "tecla", "ctrl", "f1", "shortcut"],
    text: "Principais atalhos do LouvorJA:<br>&#8226; <strong>Ctrl+B</strong> &#8212; Busca r&aacute;pida<br>&#8226; <strong>Ctrl+L</strong> &#8212; Letras<br>&#8226; <strong>Ctrl+Enter</strong> &#8212; Reproduzir/Parar<br>&#8226; <strong>Ctrl+T</strong> &#8212; Transpor tom<br>&#8226; <strong>F1</strong> &#8212; Ajuda<br>&#8226; <strong>ESC</strong> &#8212; Fechar janelas<br>&#8226; <strong>Ctrl+P</strong> &#8212; Projetar<br>&#8226; <strong>Ctrl+G</strong> &#8212; Busca b&iacute;blica<br>&#8226; <strong>Ctrl+S</strong> &#8212; Salvar playlist<br>Use <strong>*</strong> na busca para qualquer trecho entre palavras.",
    sources: ["louvorja.com/ajuda"],
  },
  {
    keywords: ["transmit", "obs", "vmix", "stream", "projetar", "segundo monitor"],
    text: "Para transmitir no OBS/VMIX:<br>1. Menu &rarr; <strong>Transmitir</strong><br>2. Configure IP e porta<br>3. Clique <strong>Iniciar Servidor</strong><br>4. Copie a URL e insira como <strong>Navegador</strong> no OBS/VMIX<br>5. Customize o <strong>CSS</strong> para formata&ccedil;&atilde;o<br><br>Dica: se der erro, tente mudar a porta.",
    sources: ["louvorja.com/ajuda"],
  },
  {
    keywords: ["letra", "cifra", "acorde"],
    text: "O LouvorJA exibe letras e cifras em tempo real! Use <strong>Ctrl+L</strong> para abrir as letras. Na configura&ccedil;&atilde;o, ajuste tamanho da fonte, cores e formato. As cifras s&atilde;o transpostas automaticamente ao mudar o tom.",
    sources: ["louvorja.com/ajuda"],
  },
  {
    keywords: ["cole\\u00e7\\u00e3o", "coletanea", "playlist"],
    text: "Tipos de cole&ccedil;&otilde;es no LouvorJA:<br>&#8226; <strong>On-line</strong> &#8212; reproduz direto do YouTube<br>&#8226; <strong>Personalizadas</strong> &#8212; suas pr&oacute;prias playlists<br>&#8226; <strong>JA</strong> &#8212; Louvores dos Jovens Adventistas<br>&#8226; <strong>Min. M&uacute;sica</strong> &#8212; Minist&eacute;rio de M&uacute;sica<br><br>Crie, edite e exporte suas cole&ccedil;&otilde;es!",
    sources: ["louvorja.com/ajuda"],
  },
  {
    keywords: ["bibl", "vers\\u00edc", "versic", "passage"],
    text: "Busca b&iacute;blica integrada! Pressione <strong>Ctrl+G</strong> para abrir. Suporta m&uacute;ltiplas vers&otilde;es b&iacute;blicas, busca por palavra-chave e navega&ccedil;&atilde;o por livro/cap&iacute;tulo/vers&iacute;culo.",
    sources: ["louvorja.com/ajuda"],
  },
  {
    keywords: ["liturg", "culto", "programa\\u00e7\\u00e3o", "programacao", "agenda", "escala"],
    text: "O m&oacute;dulo de Liturgia organiza a programa&ccedil;&atilde;o do culto:<br>&#8226; Crie itens agendados com datas<br>&#8226; Organize a sequ&ecirc;ncia do culto<br>&#8226; Vincule m&uacute;sicas e leituras b&iacute;blicas<br>&#8226; Exporte para slides de proje&ccedil;&atilde;o",
    sources: ["louvorja.com/ajuda"],
  },
  {
    keywords: ["css", "estilo", "formata\\u00e7\\u00e3o", "formatar", "apar\\u00eancia", "fonte"],
    text: "Customize a apar&ecirc;ncia da proje&ccedil;&atilde;o e transmiss&atilde;o com <strong>CSS</strong>:<br>&#8226; Edite cores, fontes e tamanhos<br>&#8226; Formate a exibi&ccedil;&atilde;o das letras<br>&#8226; Personalize o fundo e layout<br>O CSS &eacute; aplicado em tempo real.",
    sources: ["louvorja.com/ajuda"],
  },
  {
    keywords: ["editor", "slide", "apresenta\\u00e7\\u00e3o"],
    text: "O <strong>Editor de Slides</strong> permite criar slides personalizados, gravar tempos e intervalos, formatar textos e imagens, e exportar para o m&oacute;dulo de proje&ccedil;&atilde;o. Ideal para cultos e eventos especiais!",
    sources: ["louvorja.com/ajuda"],
  },
  {
    keywords: ["provai", "vede", "v\\u00eddeo", "video"],
    text: "O m&oacute;dulo <strong>Provai e Vede</strong> integra v&iacute;deos ao culto. Baixe os v&iacute;deos manualmente, cadastre na tela <strong>Itens Agendados</strong>, vincule &agrave; data do s&aacute;bado e adicione na Liturgia. O app N&Atilde;O possui os v&iacute;deos nativamente.",
    sources: ["louvorja.com/ajuda"],
  },
  {
    keywords: ["configurar", "configura\\u00e7\\u00e3o", "ajuste", "prefer\\u00eancia"],
    text: "Configura&ccedil;&otilde;es do LouvorJA:<br>&#8226; <strong>Tema</strong> &#8212; claro ou escuro<br>&#8226; <strong>Fonte</strong> &#8212; tamanho e estilo<br>&#8226; <strong>Transposi&ccedil;&atilde;o padr&atilde;o</strong> &#8212; tom padr&atilde;o<br>&#8226; <strong>Ordem das m&uacute;sicas</strong> &#8212; como s&atilde;o listadas<br>&#8226; <strong>Idioma</strong> &#8212; portugu&ecirc;s e espanhol",
    sources: ["louvorja.com/ajuda"],
  },
  {
    keywords: ["export", "salvar", "arquivo", "slja", "mp3"],
    text: "Formatos de exporta&ccedil;&atilde;o do LouvorJA:<br>&#8226; <strong>.slja</strong> &#8212; formato nativo<br>&#8226; <strong>PDF</strong> &#8212; para impress&atilde;o<br>&#8226; <strong>MP3</strong> &#8212; &aacute;udio cantado e playback<br>Exporte m&uacute;sicas, slides e playlists facilmente!",
    sources: ["louvorja.com/download"],
  },
  {
    keywords: ["download", "baixar", "instalar", "mobile", "celular", "android", "windows"],
    text: "O LouvorJA est&aacute; dispon&iacute;vel para:<br>&#8226; <strong>Android</strong> &#8212; gratuito na Play Store<br>&#8226; <strong>Windows</strong> &#8212; download no site oficial<br>&#8226; <strong>Web</strong> &#8212; acesso pelo navegador<br><br>Acesse <strong>louvorja.com/download</strong>!",
    sources: ["louvorja.com/download"],
  },
];

const QUICK_REPLIES = [
  { label: "Buscar m\u00fasica", text: "Quero buscar uma m\u00fasica" },
  { label: "Categorias", text: "Quais categorias est\u00e3o dispon\u00edveis?" },
  { label: "Hin\u00e1rio", text: "Buscar no hin\u00e1rio" },
  { label: "Atalhos", text: "Quais s\u00e3o os atalhos do LouvorJA?" },
  { label: "Transmitir", text: "Como transmitir para OBS/VMIX?" },
  { label: "Download", text: "Como baixar o app?" },
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
    uploadingFile: false,
  }),
  computed: {
    botAvatar() {
      return new URL("@/assets/imgs/chatbot-avatar.jpg", import.meta.url).href;
    },
    currentThemeName() {
      const dark = this.theme?.global?.current?.value?.dark;
      return dark
        ? "dark"
        : (this.theme?.global?.current?.value?.name || "darkblue");
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
    getApiBase() {
      return window.location.hostname === "localhost"
        ? "http://localhost:8000"
        : "https://api.louvorja.com.br";
    },
    apiHeaders() {
      return { "Content-Type": "application/json", "Api-Token": "02@v2nFB2Dc" };
    },
    hexToRgba(hex, alpha) {
      const h = hex.replace("#", "");
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    },
    lighten(hex, percent) {
      const h = hex.replace("#", "");
      const r = Math.min(255, parseInt(h.substring(0, 2), 16) + Math.round(255 * percent / 100));
      const g = Math.min(255, parseInt(h.substring(2, 4), 16) + Math.round(255 * percent / 100));
      const b = Math.min(255, parseInt(h.substring(4, 6), 16) + Math.round(255 * percent / 100));
      return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
    },
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
        this.messages.push({ role: "bot", text: resp.text, time: this.getCurrentTime(), sources: resp.sources || [] });
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
    detectIntent(text) {
      const t = text.toLowerCase();
      const isSearch = t.includes("buscar") || t.includes("procurar") || t.includes("achar") || t.includes("encontrar");
      const isMusic = t.includes("m\u00fasica") || t.includes("hino") || t.includes("som") || t.includes("louvor");
      const isCollection = t.includes("cole\u00e7\u00e3o") || t.includes("coletanea") || t.includes("playlist") || t.includes("colet\u00e2nea");
      const hasTopic = t.includes("volta") || t.includes("jesus") || t.includes("deus") || t.includes("amor") || t.includes("fe") || t.includes("esperan") || t.includes("salva") || t.includes("gratid") || t.includes("alegr") || t.includes("paz") || t.includes("redenc") || t.includes("perdao") || t.includes("adora") || t.includes("grac") || t.includes("bondade");
      // If user asks about a topic WITHIN collections, let LLM handle it (cross-reference)
      if (hasTopic && isCollection) return "knowledge";
      if (isSearch && isMusic) return "music_search";
      if (t.includes("hinari") || t.includes("hino adventista") || (/\d/.test(t) && !isCollection)) return "hymnal_search";
      if (isCollection) return "categories";
      return "knowledge";
    },
    async generateBotResponse(userText) {
      const intent = this.detectIntent(userText);
      switch (intent) {
        case "music_search": return await this.handleMusicSearch(userText);
        case "hymnal_search": return await this.handleHymnalSearch(userText);
        case "categories": return await this.handleCategories();
        case "knowledge": {
          const local = this.handleKnowledge(userText);
          if (local) return local;
          return await this.callLLM(userText);
        }
        default:
          return {
            text: this.$t("chatbot.guardrail"),
            sources: [],
          };
      }
    },
    async fetchMusicIndex() {
      try {
        const res = await fetch(`${this.getApiBase()}/json_db/pt_musics`, { headers: this.apiHeaders() });
        if (res.ok) this.musicIndex = await res.json();
      } catch (e) { console.warn("[ChatFab] Failed to load music index:", e); }
    },
    async fetchCategories() {
      if (this.categories) return this.categories;
      try {
        const res = await fetch(`${this.getApiBase()}/pt/categories`, { headers: this.apiHeaders() });
        if (res.ok) { this.categories = await res.json(); return this.categories; }
      } catch (e) { console.warn("[ChatFab] Failed to load categories:", e); }
      return null;
    },
    async fetchHymnal() {
      if (this.hymnalData) return this.hymnalData;
      try {
        const res = await fetch(`${this.getApiBase()}/pt/hymnal?limit=200`, { headers: this.apiHeaders() });
        if (res.ok) { this.hymnalData = await res.json(); return this.hymnalData; }
      } catch (e) { console.warn("[ChatFab] Failed to load hymnal:", e); }
      return null;
    },
    async handleMusicSearch(query) {
      await this.fetchMusicIndex();
      const arr = Array.isArray(this.musicIndex) ? this.musicIndex : (this.musicIndex?.data || []);
      if (!arr.length) return { text: "N\u00e3o consegui carregar o \u00edndice de m\u00fasicas. Tente novamente.", sources: [] };
      const q = query.toLowerCase().replace(/quero|gostaria de|buscar|procurar|hino|som|louvor|sobre/gi, "").trim();
      if (!q) return { text: "Digite o nome ou parte do nome da m\u00fasica que deseja buscar.", sources: [] };
      const results = arr.filter(m => {
        const title = (m.title || m.name || "").toLowerCase();
        const artist = (m.artist || m.author || "").toLowerCase();
        return title.includes(q) || artist.includes(q);
      }).slice(0, 8);
      if (!results.length) return { text: `N\u00e3o encontrei resultados para "<strong>${this.escapeHtml(q)}</strong>". Tente outro termo!`, sources: [] };
      const html = results.map(m => {
        const name = m.title || m.name || "Sem t\u00edtulo";
        const parts = [m.hymnal, m.tone ? `Tom ${m.tone}` : null, m.artist || m.author || null].filter(Boolean);
        const info = parts.join(" \u2022 ") || "\u2014";
        return `<div class="lj-search-item"><div class="lj-search-item__name">${this.escapeHtml(name)}</div><div class="lj-search-item__info">${this.escapeHtml(info)}</div></div>`;
      }).join("");
      return { text: `Encontrei <strong>${results.length}</strong> resultado(s):<div class="lj-search-results">${html}</div>`, sources: ["LouvorJA M\u00fasicas"] };
    },
    async handleHymnalSearch(query) {
      const data = await this.fetchHymnal();
      const arr = Array.isArray(data) ? data : (data?.data || []);
      if (!arr.length) return { text: "N\u00e3o consegui carregar o hin\u00e1rio. Tente novamente.", sources: [] };
      const q = query.toLowerCase().replace(/buscar|hin[aá]rio|hino|adventista|n[úu]mero|numero|no|na/g, "").trim();
      const num = parseInt(q);
      let results;
      if (!isNaN(num) && num > 0) {
        results = arr.filter(h => String(h.number || h.num || h.numero || "") === String(num));
      } else if (q) {
        results = arr.filter(h => (h.title || h.name || "").toLowerCase().includes(q));
      } else {
        results = arr.slice(0, 10);
      }
      if (!results.length) return { text: "N\u00e3o encontrei esse hino. Tente digitar o n\u00famero ou nome!", sources: [] };
      const html = results.map(h => {
        const name = h.title || h.name || "Sem t\u00edtulo";
        const number = h.number || h.num || h.numero || "";
        const parts = [number ? `Hino ${number}` : null, h.tone ? `Tom ${h.tone}` : null].filter(Boolean);
        const info = parts.join(" \u2022 ") || "\u2014";
        return `<div class="lj-search-item"><div class="lj-search-item__name">${this.escapeHtml(name)}</div><div class="lj-search-item__info">${this.escapeHtml(info)}</div></div>`;
      }).join("");
      return { text: `Hin\u00e1rio \u2014 <strong>${results.length}</strong> resultado(s):<div class="lj-search-results">${html}</div>`, sources: ["Hin\u00e1rio Adventista"] };
    },
    async handleCategories() {
      const data = await this.fetchCategories();
      const arr = Array.isArray(data) ? data : (data?.data || []);
      if (!arr.length) return { text: "N\u00e3o consegui carregar as categorias. Tente novamente.", sources: [] };
      const html = arr.map(c => {
        const name = c.name || c.title || c.category || "Sem nome";
        const count = c.count || c.total || c.music_count || "";
        const info = count ? `${count} m\u00fasicas` : "\u2014";
        return `<div class="lj-search-item"><div class="lj-search-item__name">${this.escapeHtml(name)}</div><div class="lj-search-item__info">${this.escapeHtml(info)}</div></div>`;
      }).join("");
      return { text: `<strong>Categorias dispon\u00edveis:</strong><div class="lj-search-results">${html}</div>`, sources: ["LouvorJA Categorias"] };
    },
    handleKnowledge(userText) {
      const text = userText.toLowerCase();
      for (const k of KNOWLEDGE) {
        if (k.keywords.some(kw => text.includes(kw))) return { text: k.text, sources: k.sources || [] };
      }
      return null; // no local match — will fall through to LLM
    },
    markdownToHtml(text) {
      if (!text) return "";
      return text
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        .replace(/^### (.+)$/gm, "<h4>$1</h4>")
        .replace(/^## (.+)$/gm, "<h3>$1</h3>")
        .replace(/^# (.+)$/gm, "<h2>$1</h2>")
        .replace(/^- (.+)$/gm, "<li>$1</li>")
        .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
        .replace(/\n{2,}/g, "<br><br>")
        .replace(/\n/g, "<br>");
    },

    async callLLM(userText) {
      const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
      const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
      const MODEL = "llama-3.3-70b-versatile";
      const locale = this.$i18n?.locale || "pt";
      const lang = locale === "es" ? "español" : "português brasileiro";
      const systemPrompt = buildSystemPrompt(userText, lang);
      try {
        const res = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              { role: "system", content: systemPrompt },
              ...this.messages.slice(-10).map(m => ({ role: m.role === "bot" ? "assistant" : "user", content: m.text.replace(/<[^>]*>/g, "") })),
              { role: "user", content: userText },
            ],
            max_tokens: 600,
            temperature: 0.6,
          }),
        });
        if (!res.ok) throw new Error(`Groq API ${res.status}`);
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content;
        return { text: reply || this.$t("chatbot.error"), sources: ["Groq LLM"] };
      } catch (e) {
        console.warn("[ChatFab] LLM call failed:", e);
        return {
          text: this.$t("chatbot.fallback"),
          sources: ["louvorja.com/ajuda"],
        };
      }
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      const maxBytes = 500 * 1024;
      if (file.size > maxBytes) {
        this.messages.push({ role: "bot", text: `O arquivo "${file.name}" excede o limite de 500 KB. Envie um texto mais curto ou copie e cole o conte\u00fado aqui.`, time: this.getCurrentTime() });
        this.scrollToBottom();
        event.target.value = "";
        return;
      }
      const ext = file.name.split(".").pop().toLowerCase();
      const readable = ["txt", "md", "ja"];
      if (!readable.includes(ext)) {
        this.messages.push({ role: "user", text: `[Arquivo: ${file.name}]`, time: this.getCurrentTime() });
        this.showQuickReplies = false;
        this.$nextTick(() => this.scrollToBottom());
        this.isTyping = true;
        this.$nextTick(() => this.scrollToBottom());
        setTimeout(() => {
          this.isTyping = false;
          const helpText = `Recebi o arquivo "<strong>${file.name}</strong>". Para obter sugest\u00f5es de hinos baseadas no conte\u00fado:<br><br>1. Abra o arquivo no seu computador<br>2. Copie o texto principal (tema do serm\u00e3o, programa, etc.)<br>3. Cole aqui no chat<br><br>Assim posso analisar e sugerir hinos adequados para sua programa\u00e7\u00e3o!`;
          this.messages.push({ role: "bot", text: helpText, time: this.getCurrentTime() });
          this.scrollToBottom();
        }, 800);
        event.target.value = "";
        return;
      }
      this.uploadingFile = true;
      this.messages.push({ role: "user", text: `[Analisando: ${file.name}...]`, time: this.getCurrentTime() });
      this.showQuickReplies = false;
      this.$nextTick(() => this.scrollToBottom());
      this.isTyping = true;
      this.$nextTick(() => this.scrollToBottom());
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target.result;
        const truncated = content.length > 3000 ? content.substring(0, 3000) + "\n...[conte\u00fado truncado]" : content;
        this.uploadingFile = false;
        this.messages[this.messages.length - 1] = { role: "user", text: this.escapeHtml(`[Arquivo: ${file.name}]`), time: this.getCurrentTime() };
        this.scrollToBottom();
        try {
          const resp = await this.generateBotResponse(`Analise este conte\u00fado de "${file.name}" e sugira hinos do LouvorJA relacionados:\n${truncated}`);
          this.isTyping = false;
          this.messages.push({ role: "bot", text: resp.text, time: this.getCurrentTime(), sources: resp.sources || [] });
          this.$nextTick(() => this.scrollToBottom());
        } catch {
          this.isTyping = false;
          this.messages.push({ role: "bot", text: "Erro ao analisar o arquivo. Tente novamente ou copie o conte\u00fado como mensagem.", time: this.getCurrentTime() });
          this.scrollToBottom();
        }
      };
      reader.onerror = () => {
        this.uploadingFile = false;
        this.isTyping = false;
        this.messages[this.messages.length - 1] = { role: "user", text: this.escapeHtml(file.name), time: this.getCurrentTime() };
        this.messages.push({ role: "bot", text: "N\u00e3o foi poss\u00edvel ler o arquivo. Tente novamente ou copie e cole o conte\u00fado.", time: this.getCurrentTime() });
        this.scrollToBottom();
      };
      reader.readAsText(file);
      event.target.value = "";
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

/* ========== SOURCES ========== */
.lj-sources { border-top: 1px solid rgba(0,0,0,0.06); margin-top: 2px; padding-top: 4px; }
.lj-sources--dark { border-top-color: rgba(255,255,255,0.08); }
.lj-sources__item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  opacity: 0.7;
  padding: 1px 0;
}
.lj-sources__item svg { flex-shrink: 0; }

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

.lj-attach-btn {
  background: none; border: none; padding: 4px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: opacity 0.2s;
}
.lj-attach-btn:hover { opacity: 0.7; }
.lj-attach-icon { cursor: pointer; flex-shrink: 0; }

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

<template>
  <div ref="container" class="chatbot-screen" :style="containerStyle">
    <!-- Chat Messages Area -->
    <div ref="messagesArea" class="chat-messages">
      <div class="chat-date" v-if="messages.length === 0 && !isTyping">{{ currentDate }}</div>
      <div v-for="(msg, index) in messages" :key="index" class="chat-msg" :class="{ 'chat-msg--user': msg.role === 'user' }">
        <div class="chat-msg__avatar" :style="avatarStyle(msg.role)">
          <v-icon size="small" color="white">{{ msg.role === 'bot' ? 'mdi-robot-outline' : 'mdi-account' }}</v-icon>
        </div>
        <div class="chat-msg__content">
          <div class="chat-bubble" :class="{ 'chat-bubble--user': msg.role === 'user' }" :style="bubbleStyle(msg.role)" v-html="msg.text" />
          <div class="chat-bubble__time">{{ msg.time }}<v-icon v-if="msg.role === 'bot'" size="x-small" class="ml-1" style="opacity: 0.5">mdi-check-all</v-icon></div>
          <div v-if="msg.sources && msg.sources.length" class="chat-sources">
            <div v-for="(source, si) in msg.sources" :key="si" class="chat-sources__item">
              <v-icon size="x-small">mdi-link-variant</v-icon><span>{{ source }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-if="isTyping" class="chat-msg">
        <div class="chat-msg__avatar chat-msg__avatar--bot"><v-icon size="small" color="white">mdi-robot-outline</v-icon></div>
        <div class="chat-msg__content">
          <div class="chat-bubble chat-bubble--bot">
            <div class="typing-dots"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>
          </div>
        </div>
      </div>
    </div>
    <!-- Input Area -->
    <div class="chat-input-area" :style="inputAreaStyle">
      <textarea ref="inputField" v-model="inputText" class="chat-input-field" :placeholder="placeholder" :style="inputFieldStyle" rows="1" @keydown.enter.exact.prevent="sendMessage" @input="autoResize" />
      <button class="chat-send-btn" :class="{ 'chat-send-btn--active': inputText.trim() }" :disabled="!inputText.trim() || isTyping" @click="sendMessage">
        <v-icon size="small" color="white">mdi-send</v-icon>
      </button>
    </div>
  </div>
</template>

<script>
import manifest from "../manifest.json";
import { buildSystemPrompt } from "@/utils/chatbot-rag";

const LOCALE_RESPONSES = {
  pt: {
    welcome: "Olá! Sou a <strong>LouvorJ.AI</strong>, assistente virtual do LouvorJA. Posso te ajudar com músicas, hinos, liturgia, coleções e configuração do app.",
    placeholder: "Digite sua mensagem...",
    name: "LouvorJ.AI",
    status: "Online",
    off_topic: "Desculpe, não entendi. Tente perguntar sobre músicas, hinos ou configurações do app.",
    error: "Erro ao processar sua mensagem. Tente novamente!",
    guardrail: "Por enquanto posso ajudar com músicas, hinos, configurações e dúvidas sobre o LouvorJA.",
    new_conversation: "Nova conversa",
    close: "Fechar",
    open: "Abrir assistente",
    send_file: "Anexar arquivo",
    // quick replies
    search_music: "Quero buscar uma música",
    categories: "Quais categorias estão disponíveis?",
    help: "Precisa de ajuda",
    hymnal: "Buscar no hinário",
  },
  es: {
    welcome: "¡Hola! Soy <strong>LouvorJ.AI</strong>, asistente virtual de LouvorJA. Puedo ayudarte con canciones, himnos, liturgia, colecciones y configuración de la app.",
    placeholder: "Escribe tu mensaje...",
    name: "LouvorJ.AI",
    status: "En línea",
    off_topic: "Lo siento, no entendí. Pregunta sobre canciones, himnos o configuración de la app.",
    error: "Error al procesar tu mensaje. ¡Intenta de nuevo!",
    guardrail: "Por ahora puedo ayudar con canciones, himnos, configuración y dudas sobre LouvorJA.",
    new_conversation: "Nueva conversación",
    close: "Cerrar",
    open: "Abrir asistente",
    send_file: "Adjuntar archivo",
    search_music: "Buscar una canción",
    categories: "¿Categorías disponibles?",
    help: "Necesito ayuda",
    hymnal: "Buscar en el himnario",
  },
};

const KNOWLEDGE = [
  { keywords: ["atalho", "tecla", "ctrl", "f1", "shortcut", "acceso rápido", "atajo"],
    text: "Atalhos:<br>&bull; Ctrl+B busca rápida<br>&bull; Ctrl+L letras<br>&bull; Ctrl+Enter reproduzir/parar<br>&bull; Ctrl+T transpor tom<br>&bull; F1 ajuda<br>&bull; Ctrl+P projetar<br>&bull; Ctrl+G busca bíblica<br>&bull; Ctrl+S salvar playlist<br>&bull; ESC fechar janelas" },
  { keywords: ["obs", "vmix", "stream", "transmitir", "projetar", "segundo monitor", "transmisión", "proyectar"],
    text: "Para transmitir no OBS/VMIX:<br>1. Menu &rarr; Transmitir<br>2. Configure IP e porta<br>3. Clique Iniciar Servidor<br>4. Copie a URL e insira como Navegador no OBS/VMIX<br>5. Customize o CSS para formatação" },
  { keywords: ["letra", "cifra", "acorde", "tono", "acorde"],
    text: "O LouvorJA exibe letras e cifras em tempo real! Ctrl+L para abrir letras. Transposição automática ao mudar o tom." },
  { keywords: ["coleção", "coletanea", "playlist", "categoría", "colección"],
    text: "Tipos de coleções no LouvorJA:<br>&bull; On-line — reproduz direto do YouTube<br>&bull; Personalizadas — suas próprias playlists<br>&bull; JA — Louvores dos Jovens Adventistas<br>&bull; Min. Música — Ministério de Música<br><br>Crie, edite e exporte suas coleções!" },
  { keywords: ["bíbl", "versículo", "passagem", "biblia"],
    text: "Busca bíblica integrada! Pressione Ctrl+G para abrir. Suporta múltiplas versões, busca por palavra-chave e navegação por livro/capítulo/versículo." },
  { keywords: ["liturg", "culto", "programação", "agenda", "escala", "liturgia", "culto"],
    text: "O módulo de Liturgia organiza a programação do culto. Crie itens agendados com datas, organize a sequência do culto, vincule músicas e leituras bíblicas." },
  { keywords: ["css", "estilo", "formatação", "aparência", "fonte", "apariencia"],
    text: "Customize a aparência da projeção e transmissão com CSS: cores, fontes, tamanhos, fundo e layout. Aplicado em tempo real." },
  { keywords: ["editor", "slide", "apresentação", "presentación", "diapositiva"],
    text: "O Editor de Slides permite criar slides personalizados, gravar tempos e intervalos, formatar textos e imagens, e exportar para projeção." },
  { keywords: ["provai", "vede", "vídeo", "provad", "ved"],
    text: 'O módulo <strong>Provai e Vede</strong> integra vídeos ao culto. Baixe os vídeos manualmente, cadastre em Itens Agendados, vincule à data do sábado e adicione na Liturgia.' },
  { keywords: ["configurar", "configuração", "ajuste", "preferência", "configuración", "ajuste", "preferencia"],
    text: "Configurações: Tema (claro/escuro), Fonte (tamanho e estilo), Transposição padrão, Ordem das músicas, Idioma (português e espanhol)." },
  { keywords: ["export", "salvar", "arquivo", "slja", "mp3", "exportar", "guardar"],
    text: "Exporte músicas, slides e playlists nos formatos .slja, PDF e MP3." },
  { keywords: ["download", "baixar", "instalar", "mobile", "celular", "android", "windows", "descargar", "instalar"],
    text: "O LouvorJA está disponível para Android (Play Store), Windows e Web. Acesse louvorja.com/download!" },
];

export default {
  name: "ChatbotScreen",
  props: {
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    fontSize: { type: Number, default: 13 },
    fontColor: { type: String, default: "#FFFFFF" },
  },
  data: () => ({
    messages: [],
    inputText: "",
    isTyping: false,
    placeholder: "Digite sua mensagem...",
    welcomeShown: false,
    musicIndex: null,
    categories: null,
    hymnalData: null,
    musicLoaded: false,
    uploadingFile: false,
  }),
  computed: {
    module_id() { return manifest.id; },
    module() { return this.$modules ? this.$modules.get(this.module_id) : null; },
    userdata() {
      if (!this.$userdata) return {};
      return new Proxy({}, { get: (_, key) => this.$userdata.get(`modules.${this.module.id}.${key}`, null) });
    },
    backgroundColor() { return this.userdata.background_color || "#121212"; },
    currentDate() { return new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long" }); },
    locale() { return this.$i18n?.locale || "pt"; },
    strings() { return LOCALE_RESPONSES[this.locale] || LOCALE_RESPONSES.pt; },
    containerStyle() {
      return { background: this.backgroundColor, color: this.fontColor, width: "100%", height: "100%", display: "flex", flexDirection: "column", fontFamily: "'Roboto', 'Segoe UI', sans-serif" };
    },
    inputAreaStyle() { return { borderTop: "1px solid rgba(255,255,255,0.08)" }; },
    inputFieldStyle() { return { fontSize: `${this.fontSize}px`, color: this.fontColor }; },
  },
  methods: {
    t(key) {
      if (this.$t) { try { return this.$t(`modules.${this.module_id}.${key}`); } catch {} }
      return this.strings[key] || key;
    },
    avatarStyle(role) {
      if (role === "user") return { background: "var(--v-theme-primary-lighten-1, #5C6BC0)", width: "28px", height: "28px", minWidth: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" };
      return { background: "var(--v-theme-primary, #3F51B5)", width: "36px", height: "36px", minWidth: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" };
    },
    bubbleStyle(role) { return { fontSize: `${this.fontSize}px`, lineHeight: "1.5", color: role === "user" ? "#FFFFFF" : this.fontColor }; },
    getCurrentTime() { return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); },
    getApiBase() { return window.location.hostname === "localhost" ? "http://localhost:8000" : "https://api.louvorja.com.br"; },
    apiHeaders() { return { "Content-Type": "application/json", "Api-Token": "02@v2nFB2Dc" }; },
    detectIntent(text) {
      const t = text.toLowerCase();
      const isSearch = t.includes("buscar") || t.includes("procurar") || t.includes("achar") || t.includes("encontrar");
      const isMusic = t.includes("música") || t.includes("hino") || t.includes("som") || t.includes("louvor");
      const isCollection = t.includes("coleção") || t.includes("coletanea") || t.includes("playlist") || t.includes("coletânea");
      const hasTopic = t.includes("volta") || t.includes("jesus") || t.includes("deus") || t.includes("amor") || t.includes("fé") || t.includes("esperan") || t.includes("salva") || t.includes("gratid") || t.includes("alegr") || t.includes("paz");
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
        case "knowledge": { const local = this.handleKnowledge(userText); if (local) return local; return await this.callLLM(userText); }
        default: return { text: this.t("guardrail"), sources: [] };
      }
    },
    async fetchMusicIndex() {
      if (this.musicIndex) return;
      try {
        const res = await fetch(`${this.getApiBase()}/json_db/pt_musics`, { headers: this.apiHeaders() });
        if (res.ok) this.musicIndex = await res.json();
      } catch (e) { console.warn("[ChatScreen] Failed music index:", e); }
    },
    async fetchCategories() {
      if (this.categories) return this.categories;
      try {
        const res = await fetch(`${this.getApiBase()}/pt/categories`, { headers: this.apiHeaders() });
        if (res.ok) { this.categories = await res.json(); return this.categories; }
      } catch (e) { console.warn("[ChatScreen] Failed categories:", e); }
      return null;
    },
    async fetchHymnal() {
      if (this.hymnalData) return this.hymnalData;
      try {
        const res = await fetch(`${this.getApiBase()}/pt/hymnal?limit=200`, { headers: this.apiHeaders() });
        if (res.ok) { this.hymnalData = await res.json(); return this.hymnalData; }
      } catch (e) { console.warn("[ChatScreen] Failed hymnal:", e); }
      return null;
    },
    async handleMusicSearch(query) {
      await this.fetchMusicIndex();
      const arr = Array.isArray(this.musicIndex) ? this.musicIndex : (this.musicIndex?.data || []);
      if (!arr.length) return { text: "Não consegui carregar o índice de músicas.", sources: [] };
      const q = query.toLowerCase().replace(/quero|gostaria de|buscar|procurar|hino|som|louvor|sobre/gi, "").trim();
      if (!q) return { text: "Digite o nome ou parte do nome da música.", sources: [] };
      const results = arr.filter(m => (m.title || m.name || "").toLowerCase().includes(q) || (m.artist || m.author || "").toLowerCase().includes(q)).slice(0, 8);
      if (!results.length) return { text: `Não encontrei resultados para "<strong>${this.escapeHtml(q)}</strong>". Tente outro termo!`, sources: [] };
      const html = results.map(m => {
        const name = m.title || m.name || "Sem título";
        const parts = [m.hymnal, m.tone ? `Tom ${m.tone}` : null, m.artist || m.author || null].filter(Boolean);
        return `<div class="lj-search-item"><div class="lj-search-item__name">${this.escapeHtml(name)}</div><div class="lj-search-item__info">${this.escapeHtml(parts.join(" • ") || "—")}</div></div>`;
      }).join("");
      return { text: `Encontrei <strong>${results.length}</strong> resultado(s):<div class="lj-search-results">${html}</div>`, sources: ["LouvorJA Músicas"] };
    },
    async handleHymnalSearch(query) {
      const data = await this.fetchHymnal();
      const arr = Array.isArray(data) ? data : (data?.data || []);
      if (!arr.length) return { text: "Não consegui carregar o hinário.", sources: [] };
      const q = query.toLowerCase().replace(/buscar|hin[áa]rio|hino|adventista|n[úu]mero|numero|no|na/g, "").trim();
      const num = parseInt(q);
      let results;
      if (!isNaN(num) && num > 0) results = arr.filter(h => String(h.number || h.num || h.numero || "") === String(num));
      else if (q) results = arr.filter(h => (h.title || h.name || "").toLowerCase().includes(q));
      else results = arr.slice(0, 10);
      if (!results.length) return { text: "Não encontrei esse hino. Tente o número ou nome!", sources: [] };
      const html = results.map(h => {
        const name = h.title || h.name || "Sem título";
        const number = h.number || h.num || h.numero || "";
        const info = [number ? `Hino ${number}` : null, h.tone ? `Tom ${h.tone}` : null].filter(Boolean).join(" • ") || "—";
        return `<div class="lj-search-item"><div class="lj-search-item__name">${this.escapeHtml(name)}</div><div class="lj-search-item__info">${this.escapeHtml(info)}</div></div>`;
      }).join("");
      return { text: `Hinário — <strong>${results.length}</strong> resultado(s):<div class="lj-search-results">${html}</div>`, sources: ["Hinário Adventista"] };
    },
    async handleCategories() {
      const data = await this.fetchCategories();
      const arr = Array.isArray(data) ? data : (data?.data || []);
      if (!arr.length) return { text: "Não consegui carregar as categorias.", sources: [] };
      const html = arr.map(c => {
        const name = c.name || c.title || c.category || "Sem nome";
        const count = c.count || c.total || c.music_count || "";
        return `<div class="lj-search-item"><div class="lj-search-item__name">${this.escapeHtml(name)}</div><div class="lj-search-item__info">${count ? `${count} músicas` : "—"}</div></div>`;
      }).join("");
      return { text: `<strong>Categorias disponíveis:</strong><div class="lj-search-results">${html}</div>`, sources: ["LouvorJA Categorias"] };
    },
    handleKnowledge(userText) {
      const text = userText.toLowerCase();
      for (const k of KNOWLEDGE) { if (k.keywords.some(kw => text.includes(kw))) return { text: k.text, sources: k.sources || [] }; }
      return null;
    },
    async callLLM(userText) {
      const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
      const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
      const MODEL = "llama-3.3-70b-versatile";
      const lang = this.locale === "es" ? "español" : "português brasileiro";
      const systemPrompt = buildSystemPrompt(userText, lang);
      try {
        const res = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
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
        return { text: reply || this.t("welcome"), sources: ["Groq LLM"] };
      } catch (e) {
        console.warn("[ChatScreen] LLM failed:", e);
        return { text: this.t("off_topic") };
      }
    },
    sendMessage() {
      const text = this.inputText.trim();
      if (!text || this.isTyping) return;
      this.messages.push({ role: "user", text: this.escapeHtml(text), time: this.getCurrentTime() });
      this.inputText = "";
      this.$nextTick(() => { this.scrollToBottom(); if (this.$refs.inputField) this.$refs.inputField.style.height = "auto"; });
      this.isTyping = true;
      this.$nextTick(() => this.scrollToBottom());
      setTimeout(async () => {
        this.isTyping = false;
        try {
          const resp = await this.generateBotResponse(text);
          this.messages.push({ role: "bot", text: resp.text, time: this.getCurrentTime(), sources: resp.sources || [] });
        } catch {
          this.messages.push({ role: "bot", text: this.t("error"), time: this.getCurrentTime() });
        }
        this.$nextTick(() => this.scrollToBottom());
      }, 1200 + Math.random() * 800);
    },
    escapeHtml(text) { const div = document.createElement("div"); div.textContent = text; return div.innerHTML; },
    autoResize() { const el = this.$refs.inputField; if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 100) + "px"; } },
    scrollToBottom() { const a = this.$refs.messagesArea; if (a) this.$nextTick(() => { a.scrollTop = a.scrollHeight; }); },
    showWelcome() {
      if (this.welcomeShown) return;
      this.welcomeShown = true;
      this.messages.push({ role: "bot", text: this.t("welcome"), time: this.getCurrentTime() });
      if (!this.musicLoaded) { this.musicLoaded = true; this.fetchMusicIndex().catch(() => {}); }
    },
  },
  mounted() {
    this.placeholder = this.t("placeholder") || this.placeholder;
    this.$nextTick(() => { this.showWelcome(); this.scrollToBottom(); });
  },
};
</script>

<style scoped>
.chatbot-screen { overflow: hidden; user-select: text; }
.chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 4px; }
.chat-messages::-webkit-scrollbar { width: 4px; }
.chat-messages::-webkit-scrollbar-track { background: transparent; }
.chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
.chat-date { text-align: center; font-size: 11px; opacity: 0.5; padding: 8px 0; }
.chat-msg { display: flex; gap: 8px; align-items: flex-end; max-width: 85%; }
.chat-msg--user { align-self: flex-end; flex-direction: row-reverse; }
.chat-msg__avatar { border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.chat-msg__avatar--bot { width: 36px; height: 36px; min-width: 36px; background: var(--v-theme-primary, #3F51B5); }
.chat-msg__content { display: flex; flex-direction: column; min-width: 0; }
.chat-bubble { padding: 8px 12px; word-wrap: break-word; overflow-wrap: break-word; }
.chat-bubble--bot { background: var(--v-theme-primary, #3F51B5); border-radius: 12px 12px 12px 4px; }
.chat-bubble--user { background: var(--v-theme-secondary, #FF4081); border-radius: 12px 12px 4px 12px; }
.chat-bubble__time { font-size: 10px; opacity: 0.5; padding: 2px 4px; display: flex; align-items: center; }
.chat-msg--user .chat-bubble__time { justify-content: flex-end; }
.chat-sources { border-top: 1px solid rgba(255,255,255,0.08); margin-top: 2px; padding-top: 4px; }
.chat-sources__item { display: flex; align-items: center; gap: 4px; font-size: 11px; opacity: 0.6; padding: 1px 0; }
.typing-dots { display: flex; align-items: center; gap: 4px; padding: 4px 0; }
.typing-dot { width: 6px; height: 6px; background: rgba(255,255,255,0.6); border-radius: 50%; animation: typingBounce 1.4s infinite ease-in-out; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typingBounce { 0%,60%,100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-4px); opacity: 1; } }
.chat-input-area { display: flex; align-items: center; gap: 8px; padding: 10px 14px; }
.chat-input-field { flex: 1; background: transparent; border: none; outline: none; resize: none; padding: 8px 0; font-family: inherit; max-height: 100px; }
.chat-send-btn { background: none; border: none; cursor: pointer; padding: 8px; opacity: 0.4; transition: opacity 0.2s; }
.chat-send-btn--active { opacity: 1; }
.lj-search-results { margin-top: 8px; }
.lj-search-item { padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.06); }
.lj-search-item:last-child { border-bottom: none; }
.lj-search-item__name { font-weight: 600; font-size: 13px; }
.lj-search-item__info { font-size: 11px; opacity: 0.6; margin-top: 2px; }
</style>
<template>
  <div
    ref="container"
    class="chatbot-screen"
    :style="containerStyle"
  >
    <!-- Chat Messages Area -->
    <div ref="messagesArea" class="chat-messages">
      <!-- Date Separator -->
      <div class="chat-date" v-if="messages.length === 0 && !isTyping">
        {{ currentDate }}
      </div>

      <!-- Messages -->
      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="chat-msg"
        :class="{ 'chat-msg--user': msg.role === 'user' }"
      >
        <div class="chat-msg__avatar" :style="avatarStyle(msg.role)">
          <v-icon size="small" color="white">
            {{ msg.role === 'bot' ? 'mdi-robot-outline' : 'mdi-account' }}
          </v-icon>
        </div>
        <div class="chat-msg__content">
          <div
            class="chat-bubble"
            :class="{ 'chat-bubble--user': msg.role === 'user' }"
            :style="bubbleStyle(msg.role)"
            v-html="msg.text"
          />
          <div class="chat-bubble__time">
            {{ msg.time }}
            <v-icon
              v-if="msg.role === 'bot'"
              size="x-small"
              class="ml-1"
              style="opacity: 0.5"
            >
              mdi-check-all
            </v-icon>
          </div>
          <!-- Sources -->
          <div
            v-if="msg.sources && msg.sources.length"
            class="chat-sources"
          >
            <div
              v-for="(source, si) in msg.sources"
              :key="si"
              class="chat-sources__item"
            >
              <v-icon size="x-small">mdi-link-variant</v-icon>
              <span>{{ source }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Typing Indicator -->
      <div v-if="isTyping" class="chat-msg">
        <div class="chat-msg__avatar chat-msg__avatar--bot">
          <v-icon size="small" color="white">mdi-robot-outline</v-icon>
        </div>
        <div class="chat-msg__content">
          <div class="chat-bubble chat-bubble--bot">
            <div class="typing-dots">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="chat-input-area" :style="inputAreaStyle">
      <button class="chat-attach-btn" title="Anexar arquivo">
        <v-icon size="small" color="white">mdi-paperclip</v-icon>
      </button>
      <textarea
        ref="inputField"
        v-model="inputText"
        class="chat-input-field"
        :placeholder="placeholder"
        :style="inputFieldStyle"
        rows="1"
        @keydown.enter.exact.prevent="sendMessage"
        @input="autoResize"
      />
      <button
        class="chat-send-btn"
        :class="{ 'chat-send-btn--active': inputText.trim() }"
        :disabled="!inputText.trim() || isTyping"
        @click="sendMessage"
      >
        <v-icon size="small" color="white">mdi-send</v-icon>
      </button>
    </div>
  </div>
</template>

<script>
import manifest from "../manifest.json";

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
  }),
  computed: {
    module_id() {
      return manifest.id;
    },
    module() {
      return this.$modules ? this.$modules.get(this.module_id) : null;
    },
    userdata() {
      if (!this.$userdata) return {};
      return new Proxy(
        {},
        {
          get: (_, key) => {
            return this.$userdata.get(`modules.${this.module.id}.${key}`, null);
          },
        },
      );
    },
    backgroundColor() {
      return this.userdata.background_color || "#121212";
    },
    currentDate() {
      return new Date().toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
      });
    },
    containerStyle() {
      return {
        background: this.backgroundColor,
        color: this.fontColor,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Roboto', 'Segoe UI', sans-serif",
      };
    },
    inputAreaStyle() {
      return {
        borderTop: "1px solid rgba(255,255,255,0.08)",
      };
    },
    inputFieldStyle() {
      return {
        fontSize: `${this.fontSize}px`,
        color: this.fontColor,
      };
    },
  },
  methods: {
    t(text) {
      if (this.$t) {
        try {
          return this.$t(`modules.${this.module_id}.${text}`);
        } catch {
          return text;
        }
      }
      return text;
    },

    avatarStyle(role) {
      if (role === "user") {
        return {
          background: "var(--v-theme-primary-lighten-1, #5C6BC0)",
          width: "28px",
          height: "28px",
          minWidth: "28px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        };
      }
      return {
        background: "var(--v-theme-primary, #3F51B5)",
        width: "36px",
        height: "36px",
        minWidth: "36px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      };
    },

    bubbleStyle(role) {
      return {
        fontSize: `${this.fontSize}px`,
        lineHeight: "1.5",
        color: role === "user" ? "#FFFFFF" : this.fontColor,
      };
    },

    getCurrentTime() {
      return new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    sendMessage() {
      const text = this.inputText.trim();
      if (!text || this.isTyping) return;

      // Add user message
      this.messages.push({
        role: "user",
        text: this.escapeHtml(text),
        time: this.getCurrentTime(),
      });

      this.inputText = "";
      this.$nextTick(() => {
        this.scrollToBottom();
        if (this.$refs.inputField) {
          this.$refs.inputField.style.height = "auto";
        }
      });

      // Simulate bot typing
      this.isTyping = true;
      this.$nextTick(() => this.scrollToBottom());

      setTimeout(() => {
        this.isTyping = false;
        const botResponse = this.generateBotResponse(text);
        this.messages.push({
          role: "bot",
          text: botResponse.text,
          time: this.getCurrentTime(),
          sources: botResponse.sources || [],
        });
        this.$nextTick(() => this.scrollToBottom());
      }, 1200 + Math.random() * 800);
    },

    generateBotResponse(userText) {
      const text = userText.toLowerCase();

      const responses = [
        {
          keywords: ["musica", "hino", "cantar", "louvor", "canção"],
          text: "Posso te ajudar com músicas e hinos! No LouvorJA você encontra o Hinário Adventista, LouvorJA e muito mais. Quer que eu busque uma música específica?",
          sources: ["Hinário Adventista do 7º Dia", "Coleção LouvorJA"],
        },
        {
          keywords: ["coleção", "categoria", "playlist"],
          text: "O LouvorJA tem várias coleções organizadas: Hinário Adventista, LouvorJA, Crianças, Jovens, e mais. Você pode filtrar por coleção, tom, tema e categoria.",
          sources: ["Coleções do LouvorJA"],
        },
        {
          keywords: ["tom", "cifra", "acorde"],
          text: "No app você pode transpor músicas para qualquer tom! Basta abrir a música e usar o controle de tom. As cifras são exibidas em tempo real.",
        },
        {
          keywords: ["download", "baixar", "instalar", "app"],
          text: "Você pode baixar o LouvorJA gratuitamente para Android e Windows. Acesse a página de download no site oficial.",
          sources: ["louvorja.com/download"],
        },
        {
          keywords: ["configurar", "configuração", "ajuste"],
          text: "Nas configurações do app você pode ajustar: tamanho da fonte, tema (claro/escuro), ordem das músicas, transposição padrão e muito mais!",
        },
        {
          keywords: ["ajuda", "como", "funciona", "tutorial"],
          text: "Precisa de ajuda? No site louvorja.com/ajuda você encontra tutoriais, FAQ e vídeos explicativos. Posso te ajudar com algo específico?",
          sources: ["louvorja.com/ajuda"],
        },
      ];

      for (const resp of responses) {
        if (resp.keywords.some((kw) => text.includes(kw))) {
          return { text: resp.text, sources: resp.sources || [] };
        }
      }

      return {
        text: this.t("off_topic"),
      };
    },

    escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    },

    autoResize() {
      const el = this.$refs.inputField;
      if (el) {
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 100) + "px";
      }
    },

    scrollToBottom() {
      const area = this.$refs.messagesArea;
      if (area) {
        area.scrollTop = area.scrollHeight;
      }
    },

    showWelcome() {
      if (this.welcomeShown) return;
      this.welcomeShown = true;

      this.messages.push({
        role: "bot",
        text: this.t("welcome"),
        time: this.getCurrentTime(),
      });
    },
  },
  mounted() {
    this.placeholder = this.t("placeholder") || this.placeholder;
    this.$nextTick(() => {
      this.showWelcome();
      this.scrollToBottom();
    });
  },
};
</script>

<style scoped>
.chatbot-screen {
  overflow: hidden;
  user-select: text;
}

/* Messages Area */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-messages::-webkit-scrollbar {
  width: 4px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}

/* Date Separator */
.chat-date {
  text-align: center;
  font-size: 11px;
  opacity: 0.5;
  padding: 8px 0;
}

/* Message Row */
.chat-msg {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  max-width: 85%;
}

.chat-msg--user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

/* Avatar */
.chat-msg__avatar {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chat-msg__avatar--bot {
  width: 36px;
  height: 36px;
  min-width: 36px;
  background: var(--v-theme-primary, #3F51B5);
}

/* Content */
.chat-msg__content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* Bubble */
.chat-bubble {
  padding: 8px 12px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.chat-bubble--bot {
  background: var(--v-theme-primary, #3F51B5);
  border-radius: 12px 12px 12px 4px;
}

.chat-bubble--user {
  background: var(--v-theme-secondary, #FF4081);
  border-radius: 12px 12px 4px 12px;
}

/* Time */
.chat-bubble__time {
  font-size: 10px;
  opacity: 0.5;
  padding: 2px 4px;
  display: flex;
  align-items: center;
}

.chat-msg--user .chat-bubble__time {
  justify-content: flex-end;
}

/* Sources */
.chat-sources {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: 2px;
  padding-top: 4px;
}

.chat-sources__item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  opacity: 0.6;
  padding: 1px 0;
}

/* Typing Indicator */
.typing-dots {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
}

.typing-dot {
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: typingBounce 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingBounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

/* Input Area */
.chat-input-area {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.2);
}

.chat-attach-btn {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.chat-attach-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.chat-input-field {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 8px 14px;
  resize: none;
  outline: none;
  font-family: inherit;
  max-height: 100px;
  line-height: 1.4;
  transition: border-color 0.2s;
}

.chat-input-field:focus {
  border-color: var(--v-theme-primary, #3F51B5);
}

.chat-input-field::placeholder {
  opacity: 0.4;
}

.chat-send-btn {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  opacity: 0.5;
}

.chat-send-btn--active {
  background: var(--v-theme-primary, #3F51B5);
  opacity: 1;
}

.chat-send-btn:disabled {
  cursor: not-allowed;
}
</style>

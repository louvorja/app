import $userdata from "@/helpers/UserData";

const RELAY_URL = import.meta.env.VITE_MIRROR_RELAY_URL;

export default {
  isConfigured() {
    return !!RELAY_URL;
  },

  isActive() {
    return !!$userdata.get("mirror.session_id");
  },

  getSessionInfo() {
    return {
      sessionId: $userdata.get("mirror.session_id"),
      token: $userdata.get("mirror.token"),
    };
  },

  /**
   * Cria uma sessão nova no relay (um "código" para o QR Code do culto de
   * hoje). Se já houver uma sessão ativa salva, reaproveita — assim o
   * operador não perde o código ao recarregar a página no meio do culto.
   */
  async start() {
    if (this.isActive()) {
      return this.getSessionInfo();
    }

    const res = await fetch(`${RELAY_URL}/api/sessions`, { method: "POST" });
    if (!res.ok) {
      throw new Error("Falha ao criar sessão de espelhamento");
    }
    const { sessionId, token } = await res.json();

    $userdata.set("mirror.session_id", sessionId);
    $userdata.set("mirror.token", token);

    return { sessionId, token };
  },

  async stop() {
    const { sessionId, token } = this.getSessionInfo();
    if (sessionId && token) {
      try {
        await fetch(`${RELAY_URL}/api/sessions/${sessionId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Mesmo se o relay já estiver fora do ar, limpa o estado local abaixo.
      }
    }
    $userdata.set("mirror.session_id", null);
    $userdata.set("mirror.token", null);
  },

  /**
   * URL completa que vai dentro do QR Code — a página estática /mirror.html
   * recebe tanto o código da sessão quanto o endereço do relay, então ela
   * funciona com qualquer instância do relay, sem precisar de configuração
   * própria (veja public/mirror.html).
   */
  mirrorUrl(sessionId) {
    const base = import.meta.env.BASE_URL ?? "/";
    const origin = `${window.location.origin}${base}`.replace(/\/+$/, "");
    return `${origin}/mirror.html?session=${sessionId}&relay=${encodeURIComponent(RELAY_URL)}`;
  },

  async fetchInfo() {
    const { sessionId, token } = this.getSessionInfo();
    if (!sessionId || !token) return null;
    try {
      const res = await fetch(`${RELAY_URL}/api/sessions/${sessionId}/info`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async publish(state) {
    const { sessionId, token } = this.getSessionInfo();
    if (!sessionId || !token) return;
    try {
      await fetch(`${RELAY_URL}/api/sessions/${sessionId}/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(state),
      });
    } catch (e) {
      console.warn("[Mirror] Falha ao publicar estado:", e);
    }
  },
};

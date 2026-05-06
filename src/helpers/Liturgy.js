/** @category deve-virar-composable — Usa UserData + AppData (Pinia); requer renderer. */
import $userdata from "@/helpers/UserData";
import $dev from "@/helpers/Dev";

const KEY_CATEGORIES = "modules.liturgy.scheduled_categories";
const KEY_SCHEDULED = "modules.liturgy.scheduled_items";
const KEY_ACTIVE_DAY = "modules.liturgy.active_day";
const KEY_DAYS = "modules.liturgy.days";
const KEY_DAY_NOTES = "modules.liturgy.day_notes";
// Legacy keys (pré-day-based)
const KEY_LEGACY_ITEMS = "modules.liturgy.items";
const KEY_LEGACY_WEEKS = "modules.liturgy.weeks";
const KEY_LEGACY_ACTIVE_WEEK = "modules.liturgy.active_week";
const KEY_LEGACY_WEEKDAY_NOTES = "modules.liturgy.weekday_notes";

const DEFAULT_COLOR = "#4F0000";

export const ITEM_TYPES = ["anotacao", "arquivo", "categoria", "itensagendados", "musica", "site"];

function uid(prefix = "item_") {
  const d = new Date();
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  const stamp =
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds()) +
    pad(d.getMilliseconds(), 3);
  return prefix + stamp + Math.floor(Math.random() * 1000);
}

function todayStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function todayDayIndex() {
  return new Date().getDay();
}

function clampDay(i) {
  const n = Number(i);
  if (!Number.isFinite(n)) return todayDayIndex();
  return Math.max(0, Math.min(6, Math.floor(n)));
}

export default {
  /* ---------------- Dia ativo ---------------- */
  getActiveDay() {
    const stored = $userdata.get(KEY_ACTIVE_DAY, null);
    if (stored == null) return todayDayIndex();
    return clampDay(stored);
  },

  setActiveDay(day) {
    $userdata.set(KEY_ACTIVE_DAY, clampDay(day));
  },

  /* ---------------- Itens da liturgia (por dia) ---------------- */
  _dayKey(day) {
    return `${KEY_DAYS}.${clampDay(day)}`;
  },

  /** Migra itens legados para o modelo por dia.
   *  - `modules.liturgy.items`: lista única antiga → vai para o dia de hoje.
   *  - `modules.liturgy.weeks.<semana atual>`: itens da semana corrente → vai para o dia de hoje.
   *  Chamar uma vez no boot — NUNCA dentro de getter reativo.
   */
  async migrate() {
    let migrated = false;

    // 1) Legacy `modules.liturgy.items` (pré-multi-week)
    const legacyItems = $userdata.get(KEY_LEGACY_ITEMS, null);
    if (Array.isArray(legacyItems) && legacyItems.length > 0) {
      await new Promise((r) => setTimeout(r, 0));
      const today = todayDayIndex();
      const existing = $userdata.get(this._dayKey(today), null);
      if (!existing || existing.length === 0) {
        $userdata.set(this._dayKey(today), legacyItems);
        $dev.write("liturgy:migrate legacy items → day", today);
      }
      $userdata.set(KEY_LEGACY_ITEMS, []);
      migrated = true;
    }

    // 2) Legacy multi-week (`modules.liturgy.weeks.<isoWeek>`)
    const weeks = $userdata.get(KEY_LEGACY_WEEKS, null);
    if (weeks && typeof weeks === "object") {
      const keys = Object.keys(weeks);
      if (keys.length > 0) {
        await new Promise((r) => setTimeout(r, 0));
        // Pega a semana ativa antiga (ou a primeira disponível) como melhor candidato
        const activeWeek = $userdata.get(KEY_LEGACY_ACTIVE_WEEK, null) || keys[0];
        const items = weeks[activeWeek];
        if (Array.isArray(items) && items.length > 0) {
          const today = todayDayIndex();
          const existing = $userdata.get(this._dayKey(today), null);
          if (!existing || existing.length === 0) {
            $userdata.set(this._dayKey(today), items);
            $dev.write(
              `liturgy:migrate week ${activeWeek} → day`,
              today,
              `(${items.length} itens)`
            );
          }
        }
        // Limpa estruturas antigas
        $userdata.set(KEY_LEGACY_WEEKS, {});
        $userdata.set(KEY_LEGACY_ACTIVE_WEEK, null);
        $userdata.set(KEY_LEGACY_WEEKDAY_NOTES, {});
        migrated = true;
      }
    }

    return migrated;
  },

  list(day) {
    const d = day == null ? this.getActiveDay() : clampDay(day);
    return $userdata.get(this._dayKey(d), []);
  },

  set(items, day) {
    const d = day == null ? this.getActiveDay() : clampDay(day);
    $userdata.set(this._dayKey(d), items);
  },

  get(id, day) {
    return this.list(day).find((i) => i.id === id) || null;
  },

  add(item, day) {
    const items = this.list(day);
    const merged = {
      id: uid(),
      tipo: "anotacao",
      item: "",
      subitem: "",
      cor: DEFAULT_COLOR,
      checked: "",
      duration: 0,
      ...item,
    };
    items.push(merged);
    this.set(items, day);
    $dev.write("liturgy:add", merged.item || merged.tipo);
    return merged;
  },

  update(id, patch, day) {
    const items = this.list(day).map((i) => (i.id === id ? { ...i, ...patch } : i));
    this.set(items, day);
  },

  remove(id, day) {
    this.set(
      this.list(day).filter((i) => i.id !== id),
      day
    );
  },

  reorder(items, day) {
    this.set([...items], day);
  },

  clear(day) {
    this.set([], day);
  },

  toggleChecked(id, day) {
    const item = this.get(id, day);
    if (!item) return;
    const today = todayStamp();
    this.update(id, { checked: item.checked === today ? "" : today }, day);
  },

  isCheckedToday(item) {
    return item?.checked && item.checked === todayStamp();
  },

  /* ---------------- Anotações por dia ---------------- */
  getDayNote(day) {
    return $userdata.get(`${KEY_DAY_NOTES}.${clampDay(day)}`, "");
  },

  setDayNote(day, html) {
    $userdata.set(`${KEY_DAY_NOTES}.${clampDay(day)}`, html ?? "");
  },

  /* ---------------- Helpers de criação por tipo ---------------- */
  addAnnotation(title, text, cor = DEFAULT_COLOR, day) {
    return this.add({ tipo: "anotacao", item: title, subitem: text || "", cor }, day);
  },

  addCategory(name, cor = DEFAULT_COLOR, day) {
    return this.add({ tipo: "categoria", item: name, cor }, day);
  },

  addFile(title, dir, dirInfo = "E", cor = DEFAULT_COLOR, day) {
    const isFolder = dir.endsWith("/") || dir.endsWith("\\");
    return this.add(
      {
        tipo: "arquivo",
        item: title,
        subitem: (isFolder ? "Pasta " : "Arquivo ") + dir,
        subtipo: isFolder ? "dir" : "arq",
        dir,
        dir_info: dirInfo,
        cor,
      },
      day
    );
  },

  addSite(title, url, cor = DEFAULT_COLOR, day) {
    const validUrl = this.validateUrl(url);
    return this.add(
      { tipo: "site", item: title, subitem: "Site " + validUrl, url: validUrl, cor },
      day
    );
  },

  addMusic(id_music, name, has_instrumental_music = false, cor = DEFAULT_COLOR, day) {
    return this.add(
      {
        tipo: "musica",
        item: name || `Música ${id_music}`,
        subitem: "Música " + (name || `#${id_music}`),
        musica: id_music,
        escolha: "0",
        subtipo: has_instrumental_music ? "ja" : "div",
        has_instrumental_music: !!has_instrumental_music,
        id_music,
        cor,
      },
      day
    );
  },

  addMusicChoice(cor = DEFAULT_COLOR, day) {
    return this.add(
      {
        tipo: "musica",
        item: "Clique para escolher a música",
        subitem: "Clique para escolher a música",
        musica: "-1",
        escolha: "1",
        subtipo: "escolha",
        cor,
      },
      day
    );
  },

  addScheduledItem(categoriaId, categoriaNome, cor = DEFAULT_COLOR, day) {
    return this.add(
      { tipo: "itensagendados", item: categoriaNome, subitem: "", id: categoriaId, cor },
      day
    );
  },

  validateUrl(url) {
    if (!url) return "";
    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("ftp://")) {
      return "http://" + url;
    }
    return url;
  },

  /* ---------------- Itens Agendados (categorias + itens) ----------------
   * Replica DM.cdsCategoriasItensAgendados + DM.cdsItensAgendados do Delphi.
   */
  scheduledCategories() {
    return $userdata.get(KEY_CATEGORIES, []);
  },

  setScheduledCategories(list) {
    $userdata.set(KEY_CATEGORIES, list);
  },

  addScheduledCategory(nome) {
    const list = this.scheduledCategories();
    const id = uid("cat_");
    list.push({ id, nome });
    this.setScheduledCategories(list);
    return id;
  },

  updateScheduledCategory(id, patch) {
    this.setScheduledCategories(
      this.scheduledCategories().map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  },

  removeScheduledCategory(id) {
    this.setScheduledCategories(this.scheduledCategories().filter((c) => c.id !== id));
    this.setScheduledItems(this.scheduledItems().filter((i) => i.categoria !== id));
  },

  scheduledItems() {
    return $userdata.get(KEY_SCHEDULED, []);
  },

  setScheduledItems(list) {
    $userdata.set(KEY_SCHEDULED, list);
  },

  addScheduledItemEntry(categoria, data, nome, arquivo, arquivoInfo = "E") {
    const list = this.scheduledItems();
    const id = uid("sch_");
    list.push({
      id,
      categoria,
      data,
      nome:
        nome ||
        (arquivo
          ? arquivo
              .split(/[\\/]/)
              .pop()
              .replace(/\.[^.]+$/, "")
          : ""),
      arquivo: arquivo || "",
      arquivo_info: arquivoInfo,
    });
    this.setScheduledItems(list);
    return id;
  },

  updateScheduledItemEntry(id, patch) {
    this.setScheduledItems(
      this.scheduledItems().map((i) => (i.id === id ? { ...i, ...patch } : i))
    );
  },

  removeScheduledItemEntry(id) {
    this.setScheduledItems(this.scheduledItems().filter((i) => i.id !== id));
  },

  findScheduledForToday(categoriaId, date = new Date()) {
    const iso = date.toISOString().slice(0, 10);
    return this.scheduledItems().find((i) => i.categoria === categoriaId && i.data === iso);
  },
};

/** @category deve-virar-composable — Usa UserData + AppData (Pinia); requer renderer. */
import $userdata from "@/helpers/UserData";
import $dev from "@/helpers/Dev";

const KEY_CATEGORIES = "modules.liturgy.scheduled_categories";
const KEY_SCHEDULED = "modules.liturgy.scheduled_items";
const KEY_ACTIVE_WEEK = "modules.liturgy.active_week";
const KEY_WEEKS = "modules.liturgy.weeks";
// Legacy key — items sem multi-week
const KEY_LEGACY_ITEMS = "modules.liturgy.items";

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

/** Retorna a semana ISO no formato "YYYY-WNN" para uma data. */
function isoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // ISO week: quinta-feira desta semana determina o ano da semana
  const day = d.getUTCDay() || 7; // domingo = 7
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-W${pad(week)}`;
}

/** Retorna segunda-feira e domingo de uma semana ISO "YYYY-WNN". */
export function weekBounds(weekStr) {
  const [yearStr, wStr] = weekStr.split("-W");
  const year = parseInt(yearStr, 10);
  const week = parseInt(wStr, 10);
  // 4 de janeiro sempre está na semana 1 ISO
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1) + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { monday, sunday };
}

export default {
  /* ---------------- Semana ativa ---------------- */
  getActiveWeek() {
    return $userdata.get(KEY_ACTIVE_WEEK, null) || isoWeek();
  },

  setActiveWeek(week) {
    $userdata.set(KEY_ACTIVE_WEEK, week);
  },

  /* ---------------- Itens da liturgia (multi-week) ---------------- */
  _weekKey(week) {
    return `${KEY_WEEKS}.${week}`;
  },

  /** Migra itens legados (modules.liturgy.items) para a semana corrente.
   *  Chamar uma vez no boot — NUNCA dentro de um getter reativo (causa side-effect em computed).
   */
  async migrate() {
    const legacy = $userdata.get(KEY_LEGACY_ITEMS, null);
    if (!legacy || !Array.isArray(legacy) || legacy.length === 0) return;
    // Yield ao event loop para que a UI de loading possa renderizar antes de escrever.
    await new Promise((r) => setTimeout(r, 0));
    const week = isoWeek();
    const existing = $userdata.get(this._weekKey(week), null);
    if (!existing) {
      $userdata.set(this._weekKey(week), legacy);
      $dev.write("liturgy:migrate legacy items to", week);
    }
    $userdata.set(KEY_LEGACY_ITEMS, []);
  },

  list(week) {
    const w = week || this.getActiveWeek();
    return $userdata.get(this._weekKey(w), []);
  },

  set(items, week) {
    const w = week || this.getActiveWeek();
    $userdata.set(this._weekKey(w), items);
  },

  get(id, week) {
    return this.list(week).find((i) => i.id === id) || null;
  },

  add(item, week) {
    const items = this.list(week);
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
    this.set(items, week);
    $dev.write("liturgy:add", merged.item || merged.tipo);
    return merged;
  },

  update(id, patch, week) {
    const items = this.list(week).map((i) => (i.id === id ? { ...i, ...patch } : i));
    this.set(items, week);
  },

  remove(id, week) {
    this.set(
      this.list(week).filter((i) => i.id !== id),
      week
    );
  },

  reorder(items, week) {
    this.set([...items], week);
  },

  clear(week) {
    this.set([], week);
  },

  toggleChecked(id, week) {
    const item = this.get(id, week);
    if (!item) return;
    const today = todayStamp();
    this.update(id, { checked: item.checked === today ? "" : today }, week);
  },

  isCheckedToday(item) {
    return item?.checked && item.checked === todayStamp();
  },

  /* ---------------- Anotações por dia da semana ---------------- */
  getWeekdayNote(dayIndex, week) {
    const w = week || this.getActiveWeek();
    return $userdata.get(`modules.liturgy.weekday_notes.${w}.${dayIndex}`, "");
  },

  setWeekdayNote(dayIndex, text, week) {
    const w = week || this.getActiveWeek();
    $userdata.set(`modules.liturgy.weekday_notes.${w}.${dayIndex}`, text);
  },

  /* ---------------- Helpers de criação por tipo ---------------- */
  addAnnotation(title, text, cor = DEFAULT_COLOR, week) {
    return this.add({ tipo: "anotacao", item: title, subitem: text || "", cor }, week);
  },

  addCategory(name, cor = DEFAULT_COLOR, week) {
    return this.add({ tipo: "categoria", item: name, cor }, week);
  },

  addFile(title, dir, dirInfo = "E", cor = DEFAULT_COLOR, week) {
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
      week
    );
  },

  addSite(title, url, cor = DEFAULT_COLOR, week) {
    const validUrl = this.validateUrl(url);
    return this.add(
      { tipo: "site", item: title, subitem: "Site " + validUrl, url: validUrl, cor },
      week
    );
  },

  addMusic(id_music, name, has_instrumental_music = false, cor = DEFAULT_COLOR, week) {
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
      week
    );
  },

  addMusicChoice(cor = DEFAULT_COLOR, week) {
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
      week
    );
  },

  addScheduledItem(categoriaId, categoriaNome, cor = DEFAULT_COLOR, week) {
    return this.add(
      { tipo: "itensagendados", item: categoriaNome, subitem: "", id: categoriaId, cor },
      week
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

  /* ---------------- Persistência (export/import) ---------------- */
  exportJson(week) {
    const w = week || this.getActiveWeek();
    return JSON.stringify(
      {
        version: 2,
        week: w,
        items: this.list(w),
        categories: this.scheduledCategories(),
        scheduled: this.scheduledItems(),
      },
      null,
      2
    );
  },

  importJson(text, week) {
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        this.set(data, week);
        return true;
      }
      if (data && Array.isArray(data.items)) {
        this.set(data.items, week);
        if (Array.isArray(data.categories)) this.setScheduledCategories(data.categories);
        if (Array.isArray(data.scheduled)) this.setScheduledItems(data.scheduled);
        return true;
      }
      return false;
    } catch (e) {
      $dev.write("liturgy:import error", e);
      return false;
    }
  },
};

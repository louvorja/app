/**
 * SljaConverter.js — Lê e escreve arquivos .slja (formato Delphi LouvorJA).
 *
 * O formato .slja é um ZIP com:
 *   slides.lja     — INI com seções [Geral] e [Slide:N]
 *   audio/<file>   — MP3 opcional
 *   imagens/<file> — imagens opcionais
 *
 * Convenção de codificação:
 *   - letra/letra_aux: pipe `|` representa quebra de linha (Delphi: \r\n)
 *   - cor: #RRGGBB (HTML hex)
 *   - tempo: HH:MM:SS (campo `tempo_hms`) é source-of-truth; `tempo` em bytes BASS é ignorado
 *
 * @category helper-puro — Sem APIs Vue; sem acesso ao store.
 */

function parseIniWithSections(text) {
  const sections = {};
  let currentSection = "_default";
  sections[currentSection] = {};

  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(";")) return;

    const sectionMatch = trimmed.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      if (!sections[currentSection]) sections[currentSection] = {};
      return;
    }

    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key) sections[currentSection][key] = value;
  });

  return sections;
}

function stringifyIni(sections, sectionOrder) {
  const order = sectionOrder || Object.keys(sections);
  const lines = [];
  for (const name of order) {
    const sec = sections[name];
    if (!sec) continue;
    lines.push(`[${name}]`);
    for (const [k, v] of Object.entries(sec)) {
      if (v === undefined || v === null || v === "") continue;
      lines.push(`${k}=${v}`);
    }
    lines.push("");
  }
  return lines.join("\r\n");
}

function hmsToSeconds(hms) {
  if (!hms) return 0;
  const parts = hms.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function secondsToHms(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function decodeLetra(letra) {
  if (!letra) return "";
  return letra.replace(/\|/g, "\n").replace(/\\n/g, "\n");
}

function encodeLetra(letra) {
  if (!letra) return "";
  return letra.replace(/\r\n/g, "|").replace(/\n/g, "|");
}

function parseSlja(iniText) {
  const sections = parseIniWithSections(iniText);
  const geral = sections["Geral"] || sections["_default"] || {};
  const slidesCount = parseInt(geral.slides || "0", 10);

  const slides = [];
  for (let i = 1; i <= slidesCount; i++) {
    const sec = sections[`Slide:${i}`];
    if (!sec) continue;

    slides.push({
      index: i,
      tipo: sec.tipo || "LETRA",
      letra: decodeLetra(sec.letra || ""),
      letra_aux: decodeLetra(sec.letra_aux || ""),
      tamanho_letra: parseInt(sec.tamanho_letra || (i === 1 ? "18" : "14"), 10),
      tamanho_letra_aux: parseInt(sec.tamanho_letra_aux || "10", 10),
      cor_letra: sec.cor_letra || (i === 1 ? "#efb400" : "#FFFFFF"),
      cor_letra_aux: sec.cor_letra_aux || "#efb400",
      fundo_letra: sec.fundo_letra === undefined ? true : sec.fundo_letra === "1",
      cor_fundo: sec.cor_fundo || "#000000",
      imagem: sec.imagem || "",
      imagem_posicao: parseInt(sec.imagem_posicao || "5", 10),
      tempo_seconds: hmsToSeconds(sec.tempo_hms || sec.tempo),
    });
  }

  return {
    meta: {
      slides_count: slidesCount,
      versao: geral.versao || "",
      url_musica: geral.url_musica || "",
      audio: geral.audio || "0",
    },
    slides,
  };
}

function buildIniFromSlides({ meta = {}, slides = [], audioPath = "" }) {
  const sections = {};
  const order = ["Geral"];

  sections["Geral"] = {
    slides: String(slides.length),
    audio: meta.audio || (audioPath ? "1" : "0"),
  };
  if (audioPath) sections["Geral"].url_musica = audioPath;
  if (meta.versao) sections["Geral"].versao = meta.versao;

  slides.forEach((s, idx) => {
    const i = idx + 1;
    const name = `Slide:${i}`;
    order.push(name);
    const sec = {};

    sec.tipo = s.tipo || (i === 1 ? "CAPA" : "LETRA");
    if (s.letra) sec.letra = encodeLetra(s.letra);
    if (s.letra_aux) sec.letra_aux = encodeLetra(s.letra_aux);

    sec.fundo_letra = s.fundo_letra === false ? "0" : "1";

    if (s.tamanho_letra) sec.tamanho_letra = String(s.tamanho_letra);
    if (s.tamanho_letra_aux) sec.tamanho_letra_aux = String(s.tamanho_letra_aux);
    if (s.cor_letra) sec.cor_letra = s.cor_letra;
    if (s.cor_letra_aux) sec.cor_letra_aux = s.cor_letra_aux;
    if (s.cor_fundo) sec.cor_fundo = s.cor_fundo;

    if (s.imagem) sec.imagem = s.imagem;
    if (s.imagem_posicao) sec.imagem_posicao = String(s.imagem_posicao);

    const seconds = Number(s.tempo_seconds || 0);
    sec.tempo_hms = secondsToHms(seconds);
    sec.tempo = String(seconds);

    sections[name] = sec;
  });

  return stringifyIni(sections, order);
}

async function loadSlja(file) {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(file);

  const ljaFile = zip.file("slides.lja");
  if (!ljaFile) throw new Error("slides.lja não encontrado no arquivo .slja");

  const iniText = await ljaFile.async("text");
  const parsed = parseSlja(iniText);

  let audio = null;
  let audioName = null;
  const audioFolder = zip.folder("audio");
  if (audioFolder) {
    const audioFiles = [];
    audioFolder.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) audioFiles.push({ relativePath, zipEntry });
    });
    if (audioFiles.length > 0) {
      audio = await audioFiles[0].zipEntry.async("blob");
      audioName = audioFiles[0].relativePath;
    }
  }

  const images = new Map();
  const imgFolder = zip.folder("imagens") || zip.folder("images");
  if (imgFolder) {
    const imgPromises = [];
    imgFolder.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        imgPromises.push(zipEntry.async("blob").then((blob) => images.set(relativePath, blob)));
      }
    });
    await Promise.all(imgPromises);
  }

  return { ...parsed, audio, audioName, images };
}

/**
 * Escreve um pacote .slja como Blob.
 *
 * @param {object} input
 * @param {object} [input.meta]                 Metadados gerais (versao, audio).
 * @param {Array} input.slides                  Lista de slides (schema CustomSlide).
 * @param {Blob | null} [input.audio]           Blob do MP3 (será gravado em audio/<audioName>).
 * @param {string} [input.audioName]            Nome do arquivo de áudio (default: 'audio.mp3').
 * @param {Map<string, Blob>} [input.images]    Imagens deduplicadas: chave = path no ZIP (`imagens/<name>`), valor = Blob.
 * @returns {Promise<Blob>}                     Pacote .slja pronto para download/save.
 */
async function writeSlja({
  meta = {},
  slides = [],
  audio = null,
  audioName = "audio.mp3",
  images = null,
} = {}) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  let audioPath = "";
  if (audio) {
    audioPath = `audio/${audioName.replace(/^audio\//, "")}`;
    zip.file(audioPath, audio);
  }

  const slidesForIni = slides.map((s) => {
    if (!s.imagem) return s;
    const path = s.imagem.startsWith("imagens/")
      ? s.imagem
      : `imagens/${s.imagem.split(/[\\/]/).pop()}`;
    return { ...s, imagem: path };
  });

  const iniText = buildIniFromSlides({ meta, slides: slidesForIni, audioPath });
  zip.file("slides.lja", iniText);

  if (images && images.size > 0) {
    for (const [path, blob] of images.entries()) {
      const normalized = path.startsWith("imagens/") ? path : `imagens/${path}`;
      zip.file(normalized, blob);
    }
  }

  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

export default {
  parseSlja,
  loadSlja,
  writeSlja,
  buildIniFromSlides,
  parseIniWithSections,
  stringifyIni,
  hmsToSeconds,
  secondsToHms,
  decodeLetra,
  encodeLetra,
};

/**
 * SljaConverter.js — Lê arquivos .slja legados (formato Delphi LouvorJA).
 *
 * O formato .slja é um ZIP com:
 *   slides.lja     — INI com seções [Geral] e [Slide:N]
 *   audio/<file>   — MP3 opcional
 *   imagens/<file> — imagens opcionais
 *
 * Usa o campo `tempo_hms` (HH:MM:SS) como source-of-truth para os tempos.
 * O campo `tempo` (bytes BASS) é ignorado.
 *
 * Para usar loadSlja() é necessário JSZip:
 *   npm install jszip
 * parseSlja() funciona standalone sem JSZip.
 * @category helper-puro — Sem APIs Vue; sem acesso ao store.
 */

/**
 * Parser INI simples com suporte a seções [Nome].
 *
 * @param {string} text
 * @returns {Object<string, Object<string, string>>}
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

/**
 * Converte HH:MM:SS (ou MM:SS ou SS) para segundos.
 *
 * @param {string} hms
 * @returns {number}
 */
function hmsToSeconds(hms) {
  if (!hms) return 0;
  const parts = hms.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

/**
 * Decodifica letra com pipe (|) como separador de linha (formato Delphi).
 * Também converte \n literal para newline.
 *
 * @param {string} letra
 * @returns {string}
 */
function decodeLetra(letra) {
  if (!letra) return "";
  return letra.replace(/\|/g, "\n").replace(/\\n/g, "\n");
}

/**
 * Parseia o conteúdo de um slides.lja e retorna estrutura JS.
 * Funciona sem JSZip — apenas texto INI.
 *
 * @param {string} iniText  Conteúdo do arquivo slides.lja
 * @returns {{
 *   meta: { slides_count: number, versao: string, url_musica: string, audio: string },
 *   slides: Array<{
 *     index: number,
 *     tipo: string,
 *     letra: string,
 *     letra_aux: string,
 *     tamanho_letra: number,
 *     cor_letra: string,
 *     fundo_letra: string,
 *     cor_fundo: string,
 *     imagem: string,
 *     imagem_posicao: number,
 *     time_seconds: number
 *   }>
 * }}
 */
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
      tamanho_letra: parseInt(sec.tamanho_letra || "48", 10),
      cor_letra: sec.cor_letra || "#FFFFFF",
      fundo_letra: sec.fundo_letra || "",
      cor_fundo: sec.cor_fundo || "#000000",
      imagem: sec.imagem || "",
      imagem_posicao: parseInt(sec.imagem_posicao || "5", 10), // 5 = center
      time_seconds: hmsToSeconds(sec.tempo_hms),
    });
  }

  return {
    meta: {
      slides_count: slidesCount,
      versao: geral.versao || "",
      url_musica: geral.url_musica || "",
      audio: geral.audio || "",
    },
    slides,
  };
}

/**
 * Lê um arquivo .slja (ZIP) via JSZip e retorna a estrutura completa.
 *
 * Requer JSZip instalado: npm install jszip
 *
 * @param {File | Blob | ArrayBuffer} file
 * @returns {Promise<{
 *   meta: object,
 *   slides: Array,
 *   audio: Blob | null,
 *   images: Map<string, Blob>
 * }>}
 */
async function loadSlja(file) {
  let JSZip;
  try {
    const mod = await import(/* @vite-ignore */ "jszip");
    JSZip = mod.default;
  } catch {
    throw new Error("JSZip não disponível. Instale com: npm install jszip");
  }

  const zip = await JSZip.loadAsync(file);

  // Encontrar slides.lja na raiz do ZIP
  const ljaFile = zip.file("slides.lja");
  if (!ljaFile) throw new Error("slides.lja não encontrado no arquivo .slja");

  const iniText = await ljaFile.async("text");
  const parsed = parseSlja(iniText);

  // Áudio (opcional) — primeiro arquivo da pasta audio/
  let audio = null;
  const audioFolder = zip.folder("audio");
  if (audioFolder) {
    const audioFiles = [];
    audioFolder.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) audioFiles.push({ relativePath, zipEntry });
    });
    if (audioFiles.length > 0) {
      audio = await audioFiles[0].zipEntry.async("blob");
    }
  }

  // Imagens (opcional) — mapa de nome relativo → Blob
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

  return { ...parsed, audio, images };
}

export default {
  parseSlja,
  loadSlja,
  parseIniWithSections,
  hmsToSeconds,
  decodeLetra,
};

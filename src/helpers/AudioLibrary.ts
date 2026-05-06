/**
 * AudioLibrary.ts — Biblioteca de áudio deduplicada por hash SHA-256.
 *
 * Mirror cross-platform do `dir_config\musicas\` do Delphi. Slides guardam
 * apenas tokens leves (`lib://audio/<hash>.mp3`); bytes vivem fora.
 *
 * Storage:
 *   - Web/PWA: IndexedDB (Blobs)
 *   - Electron (futuro): `userData/audio_library/` via window.louvorjaApi
 *
 * Tokens suportados em resolveAudio():
 *   - lib://audio/<hash>.<ext>   → biblioteca persistente
 *   - pkg://audio/<name>         → áudio na sessão atual (.slja aberto)
 *   - http(s)://, file://, blob: → passa direto
 *
 * @category helper-puro — Sem APIs Vue; sem acesso ao store.
 */
import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "louvorja_media";
const DB_VERSION = 1;
const STORE_AUDIO = "audio";
const STORE_IMAGES = "images";

interface AudioRecord {
  hash: string;
  blob: Blob;
  name: string;
  mime: string;
  size: number;
  addedAt: string;
}

interface ImageRecord {
  hash: string;
  blob: Blob;
  name: string;
  mime: string;
  size: number;
  addedAt: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_AUDIO)) {
          db.createObjectStore(STORE_AUDIO, { keyPath: "hash" });
        }
        if (!db.objectStoreNames.contains(STORE_IMAGES)) {
          db.createObjectStore(STORE_IMAGES, { keyPath: "hash" });
        }
      },
    });
  }
  return dbPromise;
}

async function sha256(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function extOf(name: string, fallback = "mp3"): string {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name || "");
  return m ? m[1].toLowerCase() : fallback;
}

const urlCache = new Map<string, string>();
const sessionAudio = new Map<string, Blob>();
const sessionImages = new Map<string, Blob>();

function hashFromToken(token: string): string {
  return token.replace(/^[a-z]+:\/\/(audio|image)\//, "").replace(/\.[^.]+$/, "");
}

export async function importAudio(file: File | Blob, name?: string): Promise<string> {
  const blob = file instanceof Blob ? file : new Blob([file as ArrayBuffer]);
  const hash = await sha256(blob);
  const fileName = name || (file as File).name || "audio.mp3";
  const ext = extOf(fileName);
  const db = await getDb();
  const existing = await db.get(STORE_AUDIO, hash);
  if (!existing) {
    const rec: AudioRecord = {
      hash,
      blob,
      name: fileName,
      mime: blob.type || "audio/mpeg",
      size: blob.size,
      addedAt: new Date().toISOString(),
    };
    await db.put(STORE_AUDIO, rec);
  }
  return `lib://audio/${hash}.${ext}`;
}

export async function importImage(file: File | Blob, name?: string): Promise<string> {
  const blob = file instanceof Blob ? file : new Blob([file as ArrayBuffer]);
  const hash = await sha256(blob);
  const fileName = name || (file as File).name || "image.png";
  const ext = extOf(fileName, "png");
  const db = await getDb();
  const existing = await db.get(STORE_IMAGES, hash);
  if (!existing) {
    const rec: ImageRecord = {
      hash,
      blob,
      name: fileName,
      mime: blob.type || "image/png",
      size: blob.size,
      addedAt: new Date().toISOString(),
    };
    await db.put(STORE_IMAGES, rec);
  }
  return `lib://image/${hash}.${ext}`;
}

export async function resolveAudio(token: string): Promise<string | null> {
  if (!token) return null;
  if (/^(https?|file|blob|data):/.test(token)) return token;

  const cached = urlCache.get(token);
  if (cached) return cached;

  if (token.startsWith("lib://audio/")) {
    const hash = hashFromToken(token);
    const db = await getDb();
    const rec = (await db.get(STORE_AUDIO, hash)) as AudioRecord | undefined;
    if (!rec) return null;
    const url = URL.createObjectURL(rec.blob);
    urlCache.set(token, url);
    return url;
  }

  if (token.startsWith("pkg://audio/")) {
    const blob = sessionAudio.get(token);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    urlCache.set(token, url);
    return url;
  }

  return null;
}

export async function resolveImage(token: string): Promise<string | null> {
  if (!token) return null;
  if (/^(https?|file|blob|data):/.test(token)) return token;

  const cached = urlCache.get(token);
  if (cached) return cached;

  if (token.startsWith("lib://image/")) {
    const hash = hashFromToken(token);
    const db = await getDb();
    const rec = (await db.get(STORE_IMAGES, hash)) as ImageRecord | undefined;
    if (!rec) return null;
    const url = URL.createObjectURL(rec.blob);
    urlCache.set(token, url);
    return url;
  }

  if (token.startsWith("pkg://image/") || token.startsWith("pkg://imagens/")) {
    const blob = sessionImages.get(token);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    urlCache.set(token, url);
    return url;
  }

  return null;
}

export async function getAudioBlob(token: string): Promise<Blob | null> {
  if (!token) return null;
  if (token.startsWith("lib://audio/")) {
    const db = await getDb();
    const rec = (await db.get(STORE_AUDIO, hashFromToken(token))) as AudioRecord | undefined;
    return rec?.blob || null;
  }
  if (token.startsWith("pkg://audio/")) return sessionAudio.get(token) || null;
  return null;
}

export async function getImageBlob(token: string): Promise<Blob | null> {
  if (!token) return null;
  if (token.startsWith("lib://image/")) {
    const db = await getDb();
    const rec = (await db.get(STORE_IMAGES, hashFromToken(token))) as ImageRecord | undefined;
    return rec?.blob || null;
  }
  if (token.startsWith("pkg://image/") || token.startsWith("pkg://imagens/")) {
    return sessionImages.get(token) || null;
  }
  return null;
}

export function setSessionAudio(name: string, blob: Blob): string {
  const safeName = name.replace(/^audio\//, "");
  const token = `pkg://audio/${safeName}`;
  sessionAudio.set(token, blob);
  return token;
}

export function setSessionImage(name: string, blob: Blob): string {
  const safeName = name.replace(/^(imagens|images)\//, "");
  const token = `pkg://image/${safeName}`;
  sessionImages.set(token, blob);
  return token;
}

export function clearSession(): void {
  for (const [k, url] of urlCache.entries()) {
    if (k.startsWith("pkg://")) {
      URL.revokeObjectURL(url);
      urlCache.delete(k);
    }
  }
  sessionAudio.clear();
  sessionImages.clear();
}

export function revokeUrl(token: string): void {
  const url = urlCache.get(token);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(token);
  }
}

export async function removeAudio(token: string): Promise<void> {
  if (!token.startsWith("lib://audio/")) return;
  const db = await getDb();
  await db.delete(STORE_AUDIO, hashFromToken(token));
  revokeUrl(token);
}

export async function removeImage(token: string): Promise<void> {
  if (!token.startsWith("lib://image/")) return;
  const db = await getDb();
  await db.delete(STORE_IMAGES, hashFromToken(token));
  revokeUrl(token);
}

export interface LibraryItem {
  token: string;
  name: string;
  size: number;
  addedAt: string;
}

export async function listAudio(): Promise<LibraryItem[]> {
  const db = await getDb();
  const all = (await db.getAll(STORE_AUDIO)) as AudioRecord[];
  return all.map((r) => ({
    token: `lib://audio/${r.hash}.${extOf(r.name)}`,
    name: r.name,
    size: r.size,
    addedAt: r.addedAt,
  }));
}

export async function listImages(): Promise<LibraryItem[]> {
  const db = await getDb();
  const all = (await db.getAll(STORE_IMAGES)) as ImageRecord[];
  return all.map((r) => ({
    token: `lib://image/${r.hash}.${extOf(r.name, "png")}`,
    name: r.name,
    size: r.size,
    addedAt: r.addedAt,
  }));
}

export default {
  importAudio,
  importImage,
  resolveAudio,
  resolveImage,
  getAudioBlob,
  getImageBlob,
  setSessionAudio,
  setSessionImage,
  clearSession,
  revokeUrl,
  removeAudio,
  removeImage,
  listAudio,
  listImages,
};

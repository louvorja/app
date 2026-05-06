/**
 * Valida todos os manifest.json dos módulos core contra o schema formal.
 * Roda via `npm run validate:manifests` e como prebuild.
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const MODULES_DIR = join(ROOT, "src/modules");

const VALID_CATEGORIES = new Set(["musics", "bible", "utilities", null]);
const VALID_CUSTOMIZATION_TYPES = new Set([
  "font", "color", "font-size", "border-spacing",
  "v-align", "h-align", "image", "opacity", "object-fit", "select", "boolean",
]);
const VALID_MODULE_OPTION_SIZES = new Set(["small", "medium", "large"]);
const ID_PATTERN = /^[a-z][a-z0-9_]*$/;

function findCoreManifests() {
  return readdirSync(MODULES_DIR)
    .map((entry) => join(MODULES_DIR, entry, "manifest.json"))
    .filter((p) => {
      try { statSync(p); return true; } catch { return false; }
    });
}

function validate(filePath, data) {
  const errors = [];

  // id
  if (typeof data.id !== "string" || !data.id) {
    errors.push('id: campo obrigatório do tipo string');
  } else if (!ID_PATTERN.test(data.id)) {
    errors.push(`id: deve ser snake_case (^[a-z][a-z0-9_]*$), recebido "${data.id}"`);
  }

  // name
  if (typeof data.name !== "string" || data.name.length === 0) {
    errors.push('name: campo obrigatório, string não vazia');
  }

  // description
  if (typeof data.description !== "string" || data.description.length === 0) {
    errors.push('description: campo obrigatório, string não vazia');
  }

  // category (opcional, mas se presente deve ser enum ou null)
  if ("category" in data && !VALID_CATEGORIES.has(data.category)) {
    errors.push(
      `category: deve ser "musics" | "bible" | "utilities" | null, recebido ${JSON.stringify(data.category)}`
    );
  }

  // icon (opcional, mas se presente e não null deve começar com "mdi-")
  if ("icon" in data && data.icon !== null) {
    if (typeof data.icon !== "string" || !data.icon.startsWith("mdi-")) {
      errors.push(`icon: deve começar com "mdi-" ou ser null, recebido ${JSON.stringify(data.icon)}`);
    }
  }

  // moduleOptions
  if (data.moduleOptions != null) {
    const { popup, size, ...rest } = data.moduleOptions;
    if (popup !== undefined && typeof popup !== "boolean") {
      errors.push('moduleOptions.popup: deve ser boolean');
    }
    if (size !== undefined && !VALID_MODULE_OPTION_SIZES.has(size)) {
      errors.push(`moduleOptions.size: deve ser "small" | "medium" | "large", recebido "${size}"`);
    }
    const unknown = Object.keys(rest);
    if (unknown.length > 0) {
      errors.push(`moduleOptions: propriedades desconhecidas: ${unknown.join(", ")}`);
    }
  }

  // customization
  if (data.customization != null) {
    for (const [key, field] of Object.entries(data.customization)) {
      if (typeof field !== "object" || field === null) {
        errors.push(`customization.${key}: deve ser um objeto`);
        continue;
      }
      if (!field.type) {
        errors.push(`customization.${key}: "type" obrigatório`);
      } else if (!VALID_CUSTOMIZATION_TYPES.has(field.type)) {
        errors.push(
          `customization.${key}.type: tipo desconhecido "${field.type}". ` +
          `Válidos: ${[...VALID_CUSTOMIZATION_TYPES].join(", ")}`
        );
      }
      if (!field.label) {
        errors.push(`customization.${key}: "label" obrigatório`);
      }
      if (!("default" in field)) {
        errors.push(`customization.${key}: "default" obrigatório`);
      }
    }
  }

  return errors;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const manifests = findCoreManifests();
let errorCount = 0;

for (const filePath of manifests) {
  let data;
  try {
    data = JSON.parse(readFileSync(filePath, "utf-8"));
  } catch (e) {
    console.error(`❌ ${filePath}\n   JSON inválido: ${e.message}`);
    errorCount++;
    continue;
  }

  const errors = validate(filePath, data);
  if (errors.length > 0) {
    const rel = filePath.replace(ROOT, "");
    console.error(`❌ ${rel}`);
    for (const err of errors) console.error(`   • ${err}`);
    errorCount++;
  }
}

if (errorCount > 0) {
  console.error(`\n${errorCount} manifest(s) com erro. Corrija antes de buildar.\n`);
  process.exit(1);
}

console.log(`✅ ${manifests.length} manifests válidos (src/modules).`);

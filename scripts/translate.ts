import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import OpenAI from "openai";

const LOCALES_DIR = join(process.cwd(), "src/i18n");
const EN_FILE = join(LOCALES_DIR, "en", "index.json");
const ENV_LOCAL_FILE = join(process.cwd(), ".env.local");
const MODEL = process.env.OPENAI_TRANSLATE_MODEL || "gpt-4o";
const CONCURRENCY = 6;

async function loadEnvLocal(): Promise<void> {
  if (!existsSync(ENV_LOCAL_FILE)) {
    return;
  }

  try {
    const content = await readFile(ENV_LOCAL_FILE, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const equalIndex = trimmed.indexOf("=");
      if (equalIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, equalIndex).trim();
      let value = trimmed.slice(equalIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not load ${ENV_LOCAL_FILE}:`, error);
  }
}

await loadEnvLocal();

const apiKey = (process.env.OPENAI_API_KEY || "").trim();
if (!apiKey) {
  console.error("OPENAI_API_KEY is required. Set it in .env.local");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey,
  baseURL: process.env.OPENAI_BASE_URL,
});

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

async function readJsonFile(filePath: string): Promise<JsonValue> {
  const content = await readFile(filePath, "utf-8");
  return JSON.parse(content) as JsonValue;
}

function sortObjectDeep(obj: JsonValue): JsonValue {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectDeep);
  }
  if (obj && typeof obj === "object") {
    return Object.keys(obj)
      .sort()
      .reduce((acc: Record<string, JsonValue>, k) => {
        const value = obj[k];
        if (value !== undefined) {
          acc[k] = sortObjectDeep(value);
        }
        return acc;
      }, {});
  }
  return obj;
}

async function writeJsonFile(filePath: string, data: JsonValue): Promise<void> {
  const content = JSON.stringify(sortObjectDeep(data), null, 2);
  await writeFile(filePath, content, "utf-8");
}

function diffMissing(
  source: JsonValue,
  target: JsonValue | undefined,
): JsonValue | undefined {
  if (Array.isArray(source)) {
    return source;
  }
  if (!source || typeof source !== "object") {
    return source;
  }
  const out: Record<string, JsonValue> = {};
  for (const [k, v] of Object.entries(source)) {
    const t =
      target && typeof target === "object" && !Array.isArray(target)
        ? target[k]
        : undefined;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const child = diffMissing(v, t);
      if (child && Object.keys(child).length > 0) {
        out[k] = child;
      }
    } else if (t === undefined) {
      out[k] = v;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function mergeDeep(
  source: JsonValue,
  target: JsonValue | undefined,
): JsonValue {
  if (!source || typeof source !== "object") {
    return source;
  }
  const res = {
    ...(target && typeof target === "object" && !Array.isArray(target)
      ? target
      : {}),
  };
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      res[k] = mergeDeep(
        v,
        target && typeof target === "object" && !Array.isArray(target)
          ? target[k]
          : undefined,
      );
    } else {
      res[k] = v;
    }
  }
  return res;
}

async function translateChunk(
  jsonChunk: JsonValue,
  targetLang: string,
): Promise<JsonValue> {
  const system = [
    "You translate UI strings. Output JSON only.",
    "Keep keys unchanged; translate values only.",
    "Preserve placeholders like {{name}} and HTML tags.",
    "Keep structure identical. Do not add/remove keys.",
  ].join(" ");

  const user = JSON.stringify(jsonChunk, null, 2);

  const resp = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: `Translate to ${targetLang}.\n${user}` },
    ],
    response_format: { type: "json_object" },
  });

  const content = resp.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Missing content from translation response");
  }
  return JSON.parse(content);
}

async function ensureDir(filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
}

async function listLocales(): Promise<string[]> {
  const entries = await readdir(LOCALES_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((n) => n !== "en");
}

async function runPool<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  limit: number = CONCURRENCY,
): Promise<R[]> {
  const results = new Array(items.length);
  let idx = 0;

  async function next(): Promise<void> {
    const i = idx++;
    const item = items[i];
    if (i >= items.length || item === undefined) {
      return;
    }
    try {
      results[i] = await worker(item, i);
    } catch (e) {
      results[i] = Promise.reject(e);
    }
    return next();
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, next);
  await Promise.allSettled(runners);
  return results;
}

function extractByPath(obj: JsonValue, path: string): JsonValue | undefined {
  const parts = path.split(".");
  let current: JsonValue | undefined = obj;

  for (const part of parts) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

function setByPath(
  obj: Record<string, JsonValue>,
  path: string,
  value: JsonValue,
): void {
  const parts = path.split(".");
  let current: Record<string, JsonValue> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!part) {
      continue;
    }
    if (!current[part] || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part] as Record<string, JsonValue>;
  }

  const lastPart = parts[parts.length - 1];
  if (lastPart) {
    current[lastPart] = value;
  }
}

function buildForcePayload(
  source: JsonValue,
  forceKeys: string[],
): JsonValue | undefined {
  if (forceKeys.length === 0) {
    return undefined;
  }

  const result: Record<string, JsonValue> = {};

  for (const key of forceKeys) {
    const value = extractByPath(source, key);
    if (value !== undefined) {
      setByPath(result, key, value);
    } else {
      console.warn(`Key "${key}" not found in source`);
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

async function translateLanguage(
  lang: string,
  forceKeys: string[] = [],
): Promise<{ lang: string; status: string; message: string }> {
  const targetFile = join(LOCALES_DIR, lang, "index.json");
  await ensureDir(targetFile);

  const en = await readJsonFile(EN_FILE);

  let existing: JsonValue = {};
  if (existsSync(targetFile)) {
    try {
      existing = await readJsonFile(targetFile);
    } catch {
      existing = {};
    }
  }

  const missingPayload = diffMissing(en, existing);
  const forcePayload = buildForcePayload(en, forceKeys);

  const payload = mergeDeep(forcePayload ?? {}, missingPayload ?? {});

  if (
    !payload ||
    (typeof payload === "object" && Object.keys(payload).length === 0)
  ) {
    return { lang, status: "skipped", message: "Up-to-date" };
  }

  const translated = await translateChunk(payload, lang);
  const merged = mergeDeep(translated, existing);

  await writeJsonFile(targetFile, merged);
  const keyCount =
    forceKeys.length > 0 ? ` (including ${forceKeys.length} forced)` : "";
  return { lang, status: "success", message: `Filled keys${keyCount}` };
}

function parseArgs(): { target: string; forceKeys: string[] } {
  const args = process.argv.slice(2);
  let target = "all";
  const forceKeys: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) {
      continue;
    }
    if (arg === "--key" || arg === "-k") {
      const value = args[++i];
      if (value) {
        forceKeys.push(value);
      }
    } else if (!arg.startsWith("-")) {
      target = arg;
    }
  }

  return { target, forceKeys };
}

async function main() {
  const { target, forceKeys } = parseArgs();

  if (forceKeys.length > 0) {
    console.log(`Force regenerating keys: ${forceKeys.join(", ")}\n`);
  }

  try {
    const langs = target === "all" ? await listLocales() : [target];
    if (langs.length === 0) {
      console.log("No locales to process");
      return;
    }

    console.log(`Translating ${langs.length} locale(s)...\n`);

    let success = 0,
      skipped = 0,
      failed = 0;
    await runPool(langs, async (lang) => {
      try {
        const res = await translateLanguage(lang, forceKeys);
        const icon = res.status === "success" ? "done" : "skip";
        console.log(`[${icon}] ${lang}: ${res.message}`);
        if (res.status === "success") {
          success++;
        } else {
          skipped++;
        }
      } catch (e) {
        failed++;
        const message = e instanceof Error ? e.message : String(e);
        console.error(`[fail] ${lang}:`, message);
      }
    });

    console.log("\nSummary:");
    console.log(`  Successful: ${success}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Failed: ${failed}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Translation process failed:", message);
    process.exit(1);
  }
}

main();

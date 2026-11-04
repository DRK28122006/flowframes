import fs from "node:fs";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

// Measure any audio file's length with ffprobe (part of your FFmpeg install)
export function audioSeconds(file) {
  const r = spawnSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file,
  ], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("ffprobe failed: " + r.stderr);
  return parseFloat(r.stdout.trim());
}

/**
 * providers: names to try in order, e.g. ["google", "sarvam", "windows"]
 * keys:      API keys by provider name, e.g. { google: "...", sarvam: "..." }
 * Returns:   { file, seconds, provider }
 */
export async function synthesize(text, outBase, providers = ["windows"], keys = {}) {
  const errors = [];
  for (const name of providers) {
    if (!/^[a-z0-9-]+$/.test(name)) throw new Error("Bad provider name: " + name);
    try {
      const engine = await import(`./${name}.js`);
      const file = await engine.synthesize(text, outBase, { apiKey: keys[name] });
      return { file, seconds: audioSeconds(file), provider: name };
    } catch (err) {
      console.warn(`  [tts] ${name} failed: ${err.message}`);
      errors.push(`${name}: ${err.message}`);
    }
  }
  throw new Error("All TTS providers failed:\n" + errors.join("\n"));
}

/**
 * Same as synthesize, but reuses an earlier result when the text and provider
 * list are unchanged. Returns { file, seconds, provider, cached }.
 */
export async function synthesizeCached(text, providers, keys = {}, dir = "build/audio") {
  fs.mkdirSync(dir, { recursive: true });

  // The cache key: a short fingerprint of everything that affects the audio.
  // If you later add voice, speed or language options, add them to this object.
  const fingerprint = JSON.stringify({ text, providers });
  const hash = crypto.createHash("sha1").update(fingerprint).digest("hex").slice(0, 16);

  const outBase = `${dir}/${hash}`;
  const metaFile = `${outBase}.json`;

  if (fs.existsSync(metaFile)) {
    const meta = JSON.parse(fs.readFileSync(metaFile, "utf8"));
    if (fs.existsSync(meta.file)) return { ...meta, cached: true };
  }

  const result = await synthesize(text, outBase, providers, keys);
  fs.writeFileSync(metaFile, JSON.stringify(result));   // only successes are cached
  return { ...result, cached: false };
}
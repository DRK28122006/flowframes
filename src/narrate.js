import fs from "node:fs";
import { loadLesson } from "./schema.js";
import { synthesizeCached } from "./tts/index.js";

const LEAD = 0.5;                          // seconds before the voice starts
const TAIL = 0.8;                          // quiet seconds after it ends
const PROVIDERS = ["windows"];             // later: ["google", "sarvam", "windows"]
const KEYS = {};                           // later: read from .env

// 1. Check the lesson before doing any slow work
let lesson;
try {
  lesson = loadLesson("content/lesson.json");
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

fs.mkdirSync("build/audio", { recursive: true });

// 2. Generate (or reuse) narration, and compute each scene's timing
let start = 0;
for (let i = 0; i < lesson.scenes.length; i++) {
  const scene = lesson.scenes[i];

  if (scene.narration) {
    console.log(`Narrating scene ${i + 1}...`);
    const result = await synthesizeCached(scene.narration, PROVIDERS, KEYS);
    scene.audioFile = result.file;
    scene.audioDelay = LEAD;
    scene.duration = Math.round((LEAD + result.seconds + TAIL) * 100) / 100;
    console.log(`  ${result.provider}: ${result.seconds.toFixed(2)}s${result.cached ? " (cached)" : ""}`);
  }

  scene.start = start;
  start += scene.duration;
}

fs.writeFileSync("build/lesson.timed.json", JSON.stringify(lesson, null, 2));
console.log(`Wrote build/lesson.timed.json (total ${start.toFixed(2)}s)`);
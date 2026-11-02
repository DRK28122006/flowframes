import fs from "node:fs";
import { spawnSync } from "node:child_process";

const lesson = JSON.parse(fs.readFileSync("build/lesson.timed.json", "utf8"));
const clips = lesson.scenes.filter((scene) => scene.audioFile);

if (clips.length === 0) throw new Error("No narration clips found. Run npm run narrate first.");

const args = ["-y", "-hide_banner", "-loglevel", "warning", "-i", "build/silent.mp4"];
clips.forEach((clip) => args.push("-i", clip.audioFile));

// Place each voice clip at its scene's start time (in milliseconds)
const delayed = clips.map((clip, i) => {
  const ms = Math.round((clip.start + clip.audioDelay) * 1000);
  return `[${i + 1}:a]adelay=${ms}:all=1[a${i}]`;
});
const inputs = clips.map((_, i) => `[a${i}]`).join("");

// Mix the clips together, then pad with silence so the audio lasts as long as the video
const filter =
  `${delayed.join(";")};` +
  `${inputs}amix=inputs=${clips.length}:normalize=0:duration=longest[mixed];` +
  `[mixed]apad[aout]`;

args.push(
  "-filter_complex", filter,
  "-map", "0:v", "-map", "[aout]",
  "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
  "-shortest",
  "build/out.mp4"
);

const result = spawnSync("ffmpeg", args, { stdio: "inherit" });
if (result.status !== 0) throw new Error("FFmpeg failed");
console.log("Done: build/out.mp4 (with narration)");
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

// ---------- 1. Settings ----------
const lesson = JSON.parse(fs.readFileSync("content/lesson.json", "utf8"));
const { width, height, fps } = lesson.settings;
const OUTPUT = "build/out.mp4";

// optional: `npm run render -- 3` renders only the first 3 seconds (fast test)
const limitSeconds = process.argv[2] ? Number(process.argv[2]) : null;

// ---------- 2. Open the page in a hidden browser ----------
const browser = await chromium.launch();

try {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(pathToFileURL(path.resolve("build/index.html")).href);

  // wait until the page is ready, and fonts have loaded
  await page.waitForFunction(() => typeof window.__seek === "function");
  await page.evaluate(() => document.fonts.ready);

  // ---------- 3. Work out how many frames to capture ----------
  let duration = await page.evaluate(() => window.__duration);
  if (limitSeconds) duration = Math.min(duration, limitSeconds);
  const totalFrames = Math.round(duration * fps);
  console.log(`Rendering ${totalFrames} frames (${duration}s at ${fps} fps)`);

  // ---------- 4. Start FFmpeg, waiting to receive images ----------
  const ffmpeg = spawn("ffmpeg", [
    "-y",
    "-f", "image2pipe", "-framerate", String(fps), "-i", "-",   // read images from stdin
    "-c:v", "libx264", "-pix_fmt", "yuv420p",                    // H.264 video that plays everywhere
    OUTPUT,
  ], { stdio: ["pipe", "ignore", "inherit"] });

  const finished = once(ffmpeg, "close");
  ffmpeg.stdin.on("error", () => {});   // if FFmpeg dies, the error shows up via its exit code

  // ---------- 5. The frame loop ----------
  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;                                          // time of this frame
    await page.evaluate((time) => window.__seek(time), t);      // jump to that time
    const png = await page.screenshot({ type: "png" });         // take the picture
    if (!ffmpeg.stdin.write(png)) await once(ffmpeg.stdin, "drain");   // don't overload FFmpeg
    if (i % 30 === 0) console.log(`frame ${i} / ${totalFrames}`);
  }

  // ---------- 6. Finish ----------
  ffmpeg.stdin.end();
  const [exitCode] = await finished;
  if (exitCode !== 0) throw new Error("FFmpeg failed with exit code " + exitCode);
  console.log("Done:", OUTPUT);
} finally {
  await browser.close();   // always close the browser, even after an error
}
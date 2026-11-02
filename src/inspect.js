import fs from "node:fs";

// 1. Read the file as text, then convert the text into a JavaScript object
const text = fs.readFileSync("content/lesson.json", "utf8");
const lesson = JSON.parse(text);

// 2. Read the settings
const { width, height, fps } = lesson.settings;
console.log(`Lesson: ${lesson.title}`);
console.log(`Video: ${width}x${height} at ${fps} fps`);
console.log(`Scenes: ${lesson.scenes.length}`);
console.log("");

// 3. Loop through the scenes and calculate start/end times
let start = 0;
lesson.scenes.forEach((scene, index) => {
  const end = start + scene.duration;
  const frames = scene.duration * fps;
  console.log(`Scene ${index + 1}: ${scene.title}`);
  console.log(`  time:   ${start}s to ${end}s`);
  console.log(`  frames: ${frames}`);
  start = end;
});

console.log("");
console.log(`Total length: ${start} seconds`);
console.log(`Total frames: ${start * fps}`);
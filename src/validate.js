import { loadLesson } from "./schema.js";

try {
  const lesson = loadLesson("content/lesson.json");
  console.log(`content/lesson.json is valid: ${lesson.scenes.length} scenes`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
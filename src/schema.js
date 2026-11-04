import fs from "node:fs";
import { z } from "zod";

// ---------- building blocks ----------
// A short piece of on-screen text. The limits stop text from overflowing the screen.
const short = (max) =>
  z.string().min(1, "can't be empty").max(max, `too long (max ${max} characters)`);

const evenNumber = (n) => n % 2 === 0;

// Fields every scene can have
const common = {
  id: z.string().optional(),
  narration: z.string().max(600, "too long (max 600 characters)").optional(),
  duration: z.number().positive("must be greater than 0").default(8),
};

// ---------- one schema per scene type ----------
const titleScene = z.object({
  type: z.literal("title"),
  ...common,
  heading: short(70),
  sub: z.string().max(100, "too long (max 100 characters)").default(""),
});

const pointsScene = z.object({
  type: z.literal("points"),
  ...common,
  heading: short(70),
  points: z.array(short(90)).min(1, "needs at least 1 point").max(6, "too many points (max 6)"),
});

const summaryScene = z.object({
  type: z.literal("summary"),
  ...common,
  heading: short(70),
  text: short(220),
});

const comparisonSide = z.object({ title: short(40), text: short(140) });

const comparisonScene = z.object({
  type: z.literal("comparison"),
  ...common,
  heading: short(70),
  left: comparisonSide,
  right: comparisonSide,
});

const stepsScene = z.object({
  type: z.literal("steps"),
  ...common,
  heading: short(70),
  steps: z.array(short(90)).min(1, "needs at least 1 step").max(5, "too many steps (max 5)"),
});

// "type" decides which of the schemas above is used
const sceneSchema = z.discriminatedUnion("type", [
  titleScene,
  pointsScene,
  summaryScene,
  comparisonScene,
  stepsScene,
]);

// ---------- the whole lesson ----------
export const lessonSchema = z.object({
  title: short(100),
  description: z.string().optional(),
  author: z.string().optional(),
  settings: z.object({
    width: z.number().int().positive().refine(evenNumber, "must be an even number"),
    height: z.number().int().positive().refine(evenNumber, "must be an even number"),
    fps: z.number().int().min(1).max(60),
  }),
  scenes: z.array(sceneSchema).min(1, "needs at least 1 scene"),
});

// ---------- readable error messages ----------
function describePath(path) {
  if (path[0] === "scenes" && typeof path[1] === "number") {
    const rest = path.slice(2).join(" → ");
    return `scene ${path[1] + 1}${rest ? " → " + rest : ""}`;
  }
  return path.join(" → ") || "(whole file)";
}

export function validateLesson(data) {
  const result = lessonSchema.safeParse(data);
  if (result.success) return result.data;

  const lines = result.error.issues.map(
    (issue) => `  - ${describePath(issue.path)}: ${issue.message}`
  );
  throw new Error("The lesson is not valid:\n" + lines.join("\n"));
}

// Read a lesson file from disk and validate it
export function loadLesson(file) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    throw new Error(`${file} is not valid JSON (check for a missing comma or quote): ${err.message}`);
  }
  return validateLesson(data);
}
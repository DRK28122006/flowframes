import fs from "node:fs";
import { THEME } from "./theme.js";
import { templates } from "./templates/index.js";

// ---------- 1. Read the lesson (use the timed version if narration has been generated) ----------
const timedPath = "build/lesson.timed.json";
const source = fs.existsSync(timedPath) ? timedPath : "content/lesson.json";
const lesson = JSON.parse(fs.readFileSync(source, "utf8"));
const { width, height } = lesson.settings;
console.log(`Building from ${source}`);

// ---------- 2. Turn every scene into HTML using its template ----------
let sectionsHtml = "";
const timing = [];
let start = 0;

lesson.scenes.forEach((scene, i) => {
  const number = i + 1;
  const template = templates[scene.type];
  if (!template) {
    throw new Error(
      `Scene ${number}: unknown type "${scene.type}". Available types: ${Object.keys(templates).join(", ")}`
    );
  }
  if (!(scene.duration > 0)) {
    throw new Error(`Scene ${number}: "duration" must be a number greater than 0.`);
  }

  let inner;
  try {
    inner = template.render(scene);
  } catch (err) {
    throw new Error(`Scene ${number} (${scene.type}) has missing or bad data: ${err.message}`);
  }

  sectionsHtml += `<section class="scene ${scene.type}" id="scene-${i}">${inner}</section>\n`;
  timing.push({ start, end: start + scene.duration });
  start += scene.duration;
});

// ---------- 3. Collect the CSS from every template ----------
const templateCss = Object.values(templates).map((t) => t.css(THEME)).join("\n");

// ---------- 4. Write the page ----------
fs.mkdirSync("build", { recursive: true });
fs.copyFileSync("node_modules/gsap/dist/gsap.min.js", "build/gsap.min.js");

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body { margin: 0; background: #000; }
  #stage {
    position: relative; width: ${width}px; height: ${height}px; overflow: hidden;
    background: ${THEME.background}; color: ${THEME.text}; font-family: ${THEME.font};
    transform-origin: top left;
  }
  .scene {
    position: absolute; inset: 0; box-sizing: border-box;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    text-align: center; padding: 120px; visibility: hidden;
  }
  ${templateCss}
</style>
</head>
<body>
<div id="stage">
${sectionsHtml}
</div>

<script src="gsap.min.js"></script>
<script>
  const TIMING = ${JSON.stringify(timing)};
  const stage = document.getElementById("stage");
  const sections = Array.from(document.querySelectorAll(".scene"));

  // A paused timeline: we control the time ourselves.
  const tl = gsap.timeline({ paused: true });
  sections.forEach((section, i) => {
    tl.from(section.querySelectorAll(".anim"),
      { opacity: 0, y: 50, duration: 0.8, stagger: 0.3 }, TIMING[i].start);
  });

  // The two things the renderer needs
  window.__duration = TIMING[TIMING.length - 1].end;
  window.__seek = (t) => {
    tl.time(t);
    sections.forEach((section, i) => {
      const active = t >= TIMING[i].start && t < TIMING[i].end;
      section.style.visibility = active ? "visible" : "hidden";
    });
  };
  window.__seek(0);

  // Debug mode: add ?debug to the address to get a slider
  if (location.search.includes("debug")) {
    const fit = () => { stage.style.transform = "scale(" + (window.innerWidth / ${width}) + ")"; };
    fit();
    window.addEventListener("resize", fit);

    const slider = document.createElement("input");
    slider.type = "range"; slider.min = 0; slider.max = window.__duration; slider.step = 0.01; slider.value = 0;
    slider.style.cssText = "position:fixed; bottom:12px; left:5%; width:80%; z-index:10;";
    const label = document.createElement("span");
    label.style.cssText = "position:fixed; bottom:10px; right:5%; color:#fff; font:20px monospace; z-index:10;";
    label.textContent = "0.00s";
    slider.oninput = () => {
      window.__seek(parseFloat(slider.value));
      label.textContent = parseFloat(slider.value).toFixed(2) + "s";
    };
    document.body.append(slider, label);
  }
</script>
</body>
</html>`;

fs.writeFileSync("build/index.html", html);
console.log("Built build/index.html");
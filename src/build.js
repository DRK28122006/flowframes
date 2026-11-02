import fs from "node:fs";

// ---------- 1. Read the lesson ----------
const lesson = JSON.parse(fs.readFileSync("content/lesson.json", "utf8"));
const { width, height } = lesson.settings;

// ---------- 2. Visual theme (change these to restyle everything) ----------
const THEME = {
  background: "#0f172a",
  text: "#ffffff",
  accent: "#38bdf8",
  font: "Arial, sans-serif",
};

// ---------- 3. Prepare the output folder ----------
fs.mkdirSync("build", { recursive: true });
fs.copyFileSync("node_modules/gsap/dist/gsap.min.js", "build/gsap.min.js");

// ---------- 4. Make the lesson safe to embed inside a <script> tag ----------
const data = JSON.stringify(lesson).replace(/</g, "\\u003c");

// ---------- 5. The page ----------
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
  h1 { font-size: 140px; margin: 0 0 30px; color: ${THEME.accent}; }
  h2 { font-size: 96px;  margin: 0 0 60px; color: ${THEME.accent}; }
  p  { font-size: 56px;  margin: 0; }
  ul { padding: 0; margin: 0; }
  li { font-size: 64px; margin: 24px 0; list-style: none; }
</style>
</head>
<body>
<div id="stage"></div>

<script src="gsap.min.js"></script>
<script>
  const DATA = ${data};
  const stage = document.getElementById("stage");

  // small helper: create an element containing text
  function make(tag, text) {
    const e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;   // textContent is safe (no HTML injection)
    return e;
  }

  // one function per scene type
  const templates = {
    title(scene, section) {
      section.append(make("h1", scene.heading), make("p", scene.sub));
    },
    points(scene, section) {
      const list = make("ul");
      scene.points.forEach((point) => list.append(make("li", point)));
      section.append(make("h2", scene.heading), list);
    },
  };

  // the timeline: paused, so WE control the time
  const tl = gsap.timeline({ paused: true });
  const scenes = [];     // remember each scene's element and time range
  let start = 0;

  DATA.scenes.forEach((scene) => {
    const section = make("section");
    section.className = "scene";

    const buildScene = templates[scene.type];
    if (!buildScene) throw new Error("Unknown scene type: " + scene.type);
    buildScene(scene, section);
    stage.append(section);

    // animate the scene's parts in, one after another
    tl.from(section.children, {
      opacity: 0, y: 50, duration: 0.8, stagger: 0.3
    }, start);

    scenes.push({ section, start, end: start + scene.duration });
    start += scene.duration;
  });

  // ---------- the two things the renderer needs ----------
  window.__duration = start;
  window.__seek = (t) => {
    tl.time(t);                                   // jump the animation to time t
    scenes.forEach((s) => {                       // show only the scene that is active at t
      s.section.style.visibility = (t >= s.start && t < s.end) ? "visible" : "hidden";
    });
  };
  window.__seek(0);

  // ---------- debug mode: add ?debug to the address ----------
  if (location.search.includes("debug")) {
    const fit = () => { stage.style.transform = "scale(" + (window.innerWidth / ${width}) + ")"; };
    fit();
    window.addEventListener("resize", fit);

    const slider = document.createElement("input");
    slider.type = "range"; slider.min = 0; slider.max = start; slider.step = 0.01; slider.value = 0;
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
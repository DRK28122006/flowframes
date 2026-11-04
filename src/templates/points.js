import { esc } from "../utils/escape.js";

export const css = (t) => `
  .points h2 { font-size: 96px; margin: 0 0 60px; color: ${t.accent}; }
  .points ul { padding: 0; margin: 0; }
  .points li { font-size: 64px; margin: 24px 0; list-style: none; }
`;

export function render(scene) {
  const items = scene.points.map((p) => `<li class="anim">${esc(p)}</li>`).join("");
  return `
    <h2 class="anim">${esc(scene.heading)}</h2>
    <ul>${items}</ul>
  `;
}
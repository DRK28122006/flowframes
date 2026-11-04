import { esc } from "../utils/escape.js";

export const css = (t) => `
  .title h1 { font-size: 140px; margin: 0 0 30px; color: ${t.accent}; }
  .title p  { font-size: 56px; margin: 0; color: ${t.muted}; }
`;

export function render(scene) {
  return `
    <h1 class="anim">${esc(scene.heading)}</h1>
    <p class="anim">${esc(scene.sub)}</p>
  `;
}
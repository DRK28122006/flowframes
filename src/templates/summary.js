import { esc } from "../utils/escape.js";

export const css = (t) => `
  .summary h2 { font-size: 110px; margin: 0 0 50px; color: ${t.accent}; }
  .summary p  { font-size: 64px; margin: 0; max-width: 1400px; line-height: 1.3; }
`;

export function render(scene) {
  return `
    <h2 class="anim">${esc(scene.heading)}</h2>
    <p class="anim">${esc(scene.text)}</p>
  `;
}
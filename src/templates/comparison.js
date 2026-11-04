import { esc } from "../utils/escape.js";

export const css = (t) => `
  .comparison h2 { font-size: 90px; margin: 0 0 60px; color: ${t.text}; }
  .comparison .columns { display: flex; gap: 80px; width: 100%; }
  .comparison .col { flex: 1; padding: 50px; border-radius: 24px; background: rgba(255,255,255,0.07); }
  .comparison .col h3 { font-size: 64px; margin: 0 0 24px; }
  .comparison .col p  { font-size: 44px; margin: 0; line-height: 1.3; }
  .comparison .left h3  { color: ${t.accent}; }
  .comparison .right h3 { color: ${t.accent2}; }
`;

export function render(scene) {
  return `
    <h2 class="anim">${esc(scene.heading)}</h2>
    <div class="columns">
      <div class="col left anim"><h3>${esc(scene.left.title)}</h3><p>${esc(scene.left.text)}</p></div>
      <div class="col right anim"><h3>${esc(scene.right.title)}</h3><p>${esc(scene.right.text)}</p></div>
    </div>
  `;
}
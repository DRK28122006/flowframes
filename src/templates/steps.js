import { esc } from "../utils/escape.js";

export const css = (t) => `
  .steps h2 { font-size: 90px; margin: 0 0 50px; color: ${t.accent}; }
  .steps ul { padding: 0; margin: 0; }
  .steps li { display: flex; align-items: center; gap: 32px; margin: 22px 0;
              font-size: 54px; text-align: left; list-style: none; }
  .steps .num { flex: none; width: 84px; height: 84px; border-radius: 50%;
                background: ${t.accent}; color: ${t.background}; font-weight: bold;
                font-size: 48px; display: flex; align-items: center; justify-content: center; }
`;

export function render(scene) {
  const items = scene.steps
    .map((s, i) => `<li class="anim"><span class="num">${i + 1}</span><span>${esc(s)}</span></li>`)
    .join("");
  return `
    <h2 class="anim">${esc(scene.heading)}</h2>
    <ul>${items}</ul>
  `;
}
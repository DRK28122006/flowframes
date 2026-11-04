# Scene types

Every scene needs: `id`, `type`, `duration` (seconds, overwritten when narration exists), optional `narration`.

| type       | fields                                                       |
|------------|--------------------------------------------------------------|
| title      | heading, sub                                                 |
| points     | heading, points (list of text)                               |
| summary    | heading, text                                                |
| comparison | heading, left {title, text}, right {title, text}             |
| steps      | heading, steps (list of text)                                |

## Adding a new scene type

1. Create src/templates/<name>.js exporting `css(theme)` and `render(scene)`.
2. Import it in src/templates/index.js and add it to the `templates` object.
3. Use `class="anim"` on anything that should animate in.
4. Document it in this file.
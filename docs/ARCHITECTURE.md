# FlowFrames architecture

FlowFrames turns a JSON lesson into a narrated video.

## Pipeline

content/lesson.json

  -&gt; narrate.js   makes voice files, measures them, writes build/lesson.timed.json

  -&gt; build.js     turns scenes into build/index.html (HTML + paused GSAP timeline)

  -&gt; render.js    Playwright seeks to each frame time, screenshots, pipes to FFmpeg

  -&gt; mux.js       FFmpeg places voice clips on the video: build/out.mp4

Run everything with `npm run make`.

## Design rules

1. Content, design and rendering stay separate. lesson.json never contains HTML.

2. The page exposes two things to the renderer: `window.__duration` and `window.__seek(t)`.

3. Scene length comes from measured audio length, never from guesses.

4. Every text value inserted into HTML goes through `esc()` (src/utils/escape.js).

5. Voice engines are plug-ins in src/tts/, tried in order until one works.

## Folders

- content/       the lesson (input)

- src/           all code

- src/templates/ one file per scene type

- src/tts/       one file per voice provider

- build/         generated files (ignored by Git)

- docs/          project documentation

## Safety and speed

- `lesson.json` is checked against `src/schema.js` before anything slow runs (`npm run validate`).
- Text limits in the schema prevent on-screen overflow.
- Narration is cached in `build/audio/` by a fingerprint of its text and providers.
- `build.js` refuses to run if the timed lesson is older than `lesson.json`.

## Known limitations

- Placeholder voice (Windows built-in)
- No captions, music or transitions yet
- Rendering is sequential
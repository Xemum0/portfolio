# Youcef Mhammdi Bouzina — portfolio

A hand-built, dependency-free portfolio: plain HTML, CSS and a little JavaScript. No framework, no build step.
English and French, light and dark.

```
index.html              all content, in English (the source of truth)
assets/
  css/styles.css        design tokens, layout, components, motion
  js/main.js            interactions: theme, i18n engine, phone, ABEX flow, palette…
  js/i18n.js            French translations (+ the few strings JS generates)
  fonts/                Bricolage Grotesque + Geist Mono, self-hosted (Latin subset)
  img/apps/             real app icons, masked to the iOS squircle
  img/                  portrait, avatar, social-share card (og-cover.png)
```

## Run it

Open `index.html` directly, or serve the folder (any static server works):

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

Deep links: `/?lang=fr` opens the French version, `/#abex` and `/#swiga` jump to a project.
The ⌘K / Ctrl+K command palette also works (and `/`).

## Editing

- **Copy** — edit the English text in `index.html`. Every translatable element carries a `data-i18n="key"`
  (or `data-i18n-html` / `data-i18n-attr`). The French for that key lives in `assets/js/i18n.js`.
  Write normal spaces in French strings; the script inserts the no-break spaces before `? ! : ;` itself.
- **Add a project** — duplicate one `<article class="proj">` block, set its `--c` / `--on-c` brand colours, add the
  icon to `assets/img/apps/`, add its keys to `i18n.js`, and add a `data-open` button in the phone if you want it on the home screen.
- **Colours / type** — all tokens are at the top of `styles.css` (`--hl` is the highlighter accent).
- **Add a language** — add a top-level key in `i18n.js` (e.g. `ar`), then allow it in the `<head>` script and in `I18N.set()`.

## Deploy

Static files, so GitHub Pages works as-is (Settings → Pages → deploy from `main`, root).
Once the final URL is known, make `og:image` in `index.html` absolute so link previews work everywhere.

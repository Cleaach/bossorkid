# Boss or Kid?

A quote appears. Was it a child, or was it your boss? Ten rounds, instant feedback,
answer review at the end. Neobrutalist UI: thick black borders, hard offset shadows,
flat yellow-and-violet palette.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Markup for all three screens (start / quiz / results) |
| `styles.css` | Design tokens + all styling. Change tokens in `:root`, not individual rules |
| `app.js` | Game logic: deck building, scoring, streaks, review list |
| `quotes.js` | The quote bank — **this is the file you edit most** |
| `.nojekyll` | Tells GitHub Pages to serve the files as-is |

## Adding quotes

Open `quotes.js` and append entries:

```js
{ text: "Can we make the logo bigger, but also smaller?", source: 'boss', note: 'Said twice.' },
```

- `source` must be `'kid'` or `'boss'`.
- `note` is optional; it shows under the verdict after the guess.
- Keep the kid and boss lists roughly equal in length — each round draws a
  balanced 5/5 deck, so a lopsided bank makes the game guessable.

## Run locally

Open `index.html` in a browser. That's it. For a local server:

```bash
python -m http.server 8000
```

## Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "Boss or Kid? MVP"
git branch -M main
git remote add origin https://github.com/<you>/boss-or-kid.git
git push -u origin main
```

Then: repo → **Settings** → **Pages** → Source: *Deploy from a branch* →
Branch: `main`, folder: `/ (root)` → Save. Live at
`https://<you>.github.io/boss-or-kid/` in about a minute.

## About the leaderboard

Confirmed: a **global** leaderboard needs a backend. GitHub Pages serves static
files only — no server, no database, no way to persist a score that other players
can see. The current build stores a personal best in `localStorage`, which is
per-browser and private to each player.

When you want a real one, the smallest path is a hosted database with a public
API — Supabase free tier is the usual pick. See the leaderboard notes in the
project discussion for the schema and the cheating caveat (any client-side score
submission can be forged; a serverless function that validates the run is the fix).

# AI Competition Radar

A live radar of **online, globally-open AI competitions, agent challenges and hackathons** —
upcoming, in progress, or ended within the last 7 days.

🔗 **Live site:** https://nobodyme.github.io/hackathons-online/

## How it works

Layout and data are deliberately separated:

| File | Role |
| --- | --- |
| `index.html` | Page shell / structure |
| `styles.css` | Design, responsive layout, light + dark themes |
| `app.js` | Fetches `competitions.json` and renders cards, filters and sort **live in the browser** — it recomputes status and countdowns from the current date, so the page stays accurate between refreshes |
| `competitions.json` | **The only file that changes on a refresh** — the competition list |
| `assets/fonts/` | Self-hosted Archivo (variable woff2) — no external font dependency |
| `.github/workflows/deploy.yml` | Publishes the site to GitHub Pages on every push to `main` |

The visual style is **Neo-brutalist**: a butter-cream ground (`#fff5db`), chunky Archivo set
heavy, 3px black outlines with hard offset shadows, zero corner radius, and bright color-coded
status badges (orange accent, yellow = in progress, mint = upcoming). Design tokens live at the
top of `styles.css` — restyling is a matter of editing those variables.

Because the page renders `competitions.json` client-side, refreshing the data is just a matter of
overwriting that one file — the layout never has to be regenerated.

### `competitions.json` shape

```json
{
  "generated": "YYYY-MM-DD",
  "items": [
    {
      "id": "stable-kebab-slug",
      "name": "…",
      "platform": "Devpost",
      "url": "https://…",
      "type": "agent-challenge | coding-challenge | hackathon | benchmark",
      "format": "online | hybrid",
      "location": "Online",
      "start": "YYYY-MM-DD",
      "end": "YYYY-MM-DD",
      "reg": "YYYY-MM-DD",
      "prize": 10000,
      "prize_kind": "cash | mixed | non-cash | unknown",
      "prize_note": "e.g. split across tracks",
      "summary": "One sentence, ≤160 chars.",
      "conf": "confirmed | approximate | unknown",
      "eligibility": "Open globally, 18+",
      "tags": ["agents", "llm"]
    }
  ]
}
```

`start`, `end` and `reg` are all **required** — no date field is ever null. A competition whose
start or end date cannot be established is left out of the file entirely rather than published
with a null: an entry you cannot plan around is not worth a row.

Many competitions have no registration step separate from submission (ARC Prize, MLH Global Hack
Week, most Devpost hackathons). For those, `reg` carries the submission deadline, which is the
same as `end`. So `reg == end` means "no separate registration cutoff — you have until the
deadline"; `reg < end` means there is a real earlier cutoff to watch.

Rules the page enforces automatically:
- **Retention:** entries whose `end` is more than 7 days in the past are hidden.
- **Status** is derived from dates (`upcoming` / `in-progress` / `completed`).
- Prize pools are shown as advertised — non-cash pools (credits/hardware) are flagged.

## Automated refresh experiment
The content is curated by Claude on 3 day schedule, fully AI curated and pushes to this branch which then publishes the github page. Let's see how useful this experiment turns out to be.


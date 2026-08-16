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
| `.github/workflows/deploy.yml` | Publishes the site to GitHub Pages on every push to `main` |

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
      "start": "YYYY-MM-DD | null",
      "end": "YYYY-MM-DD | null",
      "reg": "YYYY-MM-DD | null",
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

Rules the page enforces automatically:
- **Retention:** entries whose `end` is more than 7 days in the past are hidden.
- **Status** is derived from dates (`upcoming` / `in-progress` / `completed`); items with no dates
  show "Dates to be announced".
- Prize pools are shown as advertised — non-cash pools (credits/hardware) are flagged.

## Automated refresh

An external schedule ("AI Competition Radar — 3-day refresh") researches current competitions every
3 days and pushes an updated `competitions.json` to `main`, which triggers the Pages deploy above.
Nothing else in the repo changes between refreshes.

## One-time setup

1. Merge this to `main`.
2. In **Settings → Pages → Build and deployment → Source**, choose **GitHub Actions**.

The first push to `main` then publishes the site, and every later refresh updates it automatically.

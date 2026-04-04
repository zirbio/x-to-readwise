# x-to-readwise

## Project overview

Pipeline to reduce X/Twitter dependency by routing followed accounts through Readwise Reader. Uses a public Twitter List as RSS source, automatic digest generation by Reader (2x daily), and Claude Code skill for AI-powered curation.

## Architecture

```
X Following List → Public Twitter List → Readwise Reader RSS → Automatic Digest → Claude Curation → Curated Article in Reader
```

## Key resources

| Resource | Value |
|----------|-------|
| Twitter List | `Mi Feed Completo` (ID: `2040078195655909434`) |
| List URL | `https://x.com/i/lists/2040078195655909434` |
| Readwise CLI | `/opt/homebrew/bin/readwise` |
| Digest frequency | 2x daily (AM/PM editions) |

## Scripts

- `scripts/extract-following.js` — Browser console script to extract following list from X profile
- `scripts/batch-add-to-list.js` — Browser console script to batch-add usernames to a Twitter List via GraphQL API

## Skills

- `skills/x-feed-curado/SKILL.md` — Claude Code skill that curates digests into top 10-15 tweets

## Development notes

- Browser scripts run in the DevTools console on x.com (no external dependencies)
- Readwise CLI handles OAuth token refresh automatically
- HTML output uses inline styles only (Reader ignores external CSS)

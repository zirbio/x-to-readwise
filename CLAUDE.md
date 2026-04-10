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
- `scripts/readwise_mcp.py` — Standalone Readwise MCP client (Python, no dependencies) for remote agent use

## Skills

- `skills/x-feed-curado/SKILL.md` — Claude Code skill that curates digests into top 10-15 tweets (manual, local)

## Scheduled agent

A remote Claude Code agent runs 2x daily to curate the X/Twitter digest and email it via Resend.

| Resource | Value |
|----------|-------|
| Trigger name | `x-feed-curado` |
| Trigger ID | `trig_01BefSB4UTdQNY8XkBFFKDau` |
| Cron (UTC) | `0 5,17 * * *` (7:00 / 19:00 Europe/Madrid CEST) |
| Management | https://claude.ai/code/scheduled |
| Prompt source | `prompts/scheduled-curation-agent.md` |
| Email from | `curado@mcdalmeria.com` (via Resend) |
| Email to | `requenasilvio@gmail.com` |

To update the curation prompt: edit `prompts/scheduled-curation-agent.md`, then update the trigger via `/schedule` or the web UI.

## Development notes

- Browser scripts run in the DevTools console on x.com (no external dependencies)
- Readwise CLI handles OAuth token refresh automatically
- HTML output uses inline styles only (Gmail and Reader ignore external CSS)
- DST note: cron `0 5,17` = 7:00/19:00 in CEST (summer). In CET (winter), it shifts to 6:00/18:00. Adjust to `0 6,18` in October if needed.

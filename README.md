# x-to-readwise

Reduce your X/Twitter dependency by routing your timeline through [Readwise Reader](https://readwise.io/read). Instead of opening X, get a curated AI-filtered digest of your followed accounts delivered to Readwise Reader twice daily.

## How it works

```
Your X Following → Public Twitter List → Readwise Reader RSS → Auto Digest (2x/day) → AI Curation → Curated Article
```

1. **Extract** your X following list using a browser script
2. **Create** a public Twitter List with all your followed accounts
3. **Subscribe** to the list in Readwise Reader (native Twitter List support)
4. **Reader generates** AM and PM digest editions automatically
5. **Curate** each digest with Claude Code, keeping only the 10-15 most valuable tweets
6. **Read** the curated feed in Readwise Reader as a clean article

## Why

- Stop doomscrolling X's algorithmic timeline
- Get a chronological, complete view of your followed accounts
- AI filters out noise (promos, memes, low-effort retweets) keeping only signal
- Read in Readwise Reader's distraction-free interface
- Zero infrastructure to maintain

## Setup

### Prerequisites

- A Twitter/X account with accounts you follow
- A [Readwise Reader](https://readwise.io/read) account
- [Readwise CLI](https://github.com/Scarvy/readwise-cli) installed and authenticated
- [Claude Code](https://claude.ai/code) for the curation skill

### Step 1: Extract your following list

Navigate to `https://x.com/{your_username}/following` and run [`scripts/extract-following.js`](scripts/extract-following.js) in the browser DevTools console.

```js
// After the script completes:
copy(window.__followingList) // copies usernames to clipboard
```

### Step 2: Create a public Twitter List

1. Go to X → Lists → Create new list
2. Name it (e.g., "Mi Feed Completo")
3. Set visibility to **Public** (required for RSS)
4. Note the List ID from the URL

### Step 3: Batch add accounts to the list

1. Set `LIST_ID` in [`scripts/batch-add-to-list.js`](scripts/batch-add-to-list.js)
2. Ensure `window.__followingList` is populated (from Step 1)
3. Run the script in DevTools console
4. Monitor progress via `window.__addProgress`

### Step 4: Subscribe in Readwise Reader

Readwise Reader natively supports Twitter Lists as RSS feeds. Add your list URL in Reader's feed manager:

```
https://x.com/i/lists/{LIST_ID}
```

Reader will automatically generate two digest editions per day (AM and PM).

### Step 5: Install the curation skill

Copy the skill to your Claude Code skills directory:

```bash
cp -r skills/x-feed-curado ~/.claude/skills/
```

### Step 6: Curate your feed

In Claude Code, run:

```
/x-feed-curado
```

Or say "cura mi feed" to trigger the curation pipeline.

### Automated option: Scheduled agent

Instead of running `/x-feed-curado` manually, a scheduled agent curates automatically and emails you the result twice daily (7:00 AM / 7:00 PM):

1. Set up Resend (API key + verified domain)
2. Deploy the scheduled agent via `/schedule` — see `prompts/scheduled-curation-agent.md`
3. Manage at https://claude.ai/code/scheduled

## Project structure

```
x-to-readwise/
├── prompts/
│   └── scheduled-curation-agent.md  # Prompt for the scheduled cloud agent
├── scripts/
│   ├── extract-following.js         # Extract following list from X profile
│   ├── batch-add-to-list.js         # Batch add users to a Twitter List
│   └── readwise_mcp.py             # Readwise MCP client for remote use
├── skills/
│   └── x-feed-curado/
│       └── SKILL.md                 # Claude Code skill for manual curation
├── CLAUDE.md                        # Project instructions for Claude Code
├── LICENSE                          # MIT
└── README.md
```

## Curation output

The curated digest is uploaded to Readwise Reader as an article with:

- Color-coded sections by relevance score (9-10 amber, 8 green, 7 blue, 6 gray)
- TL;DR summary of the day's key topics
- Direct links to original tweets
- Tags: `curado`, `x-feed`, `claude-code`

## License

MIT

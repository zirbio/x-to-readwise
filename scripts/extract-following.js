/**
 * Extract Following List from X/Twitter
 *
 * Run this script in the browser DevTools console while logged in to X.
 * Navigate to https://x.com/{your_username}/following before running.
 *
 * The script auto-scrolls the page, collecting all visible usernames.
 * Results are stored in window.__followingList and logged to console.
 *
 * Usage:
 *   1. Go to x.com/{username}/following
 *   2. Open DevTools (F12 or Cmd+Opt+I)
 *   3. Paste this script in the Console tab
 *   4. Wait for completion
 *   5. Copy results: copy(window.__followingList)
 */

(async function extractFollowing() {
  const usernames = new Set();
  const SCROLL_PX = 800;
  const SCROLL_DELAY_MS = 1000;
  const MAX_ITERATIONS = 100;
  const STABLE_THRESHOLD = 5; // stop after N iterations with no new usernames

  let stableCount = 0;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const cells = document.querySelectorAll('[data-testid="UserCell"]');

    cells.forEach((cell) => {
      const links = cell.querySelectorAll('a[href^="/"]');
      links.forEach((link) => {
        const href = link.getAttribute("href");
        if (href && href.match(/^\/[A-Za-z0-9_]+$/) && link.textContent.includes("@")) {
          usernames.add(href.slice(1)); // remove leading /
        }
      });
    });

    const prevSize = usernames.size;
    window.scrollBy(0, SCROLL_PX);
    await new Promise((r) => setTimeout(r, SCROLL_DELAY_MS));

    if (usernames.size === prevSize) {
      stableCount++;
      if (stableCount >= STABLE_THRESHOLD) {
        console.log(`Stable after ${i + 1} iterations. Done.`);
        break;
      }
    } else {
      stableCount = 0;
    }

    if ((i + 1) % 10 === 0) {
      console.log(`Iteration ${i + 1}: ${usernames.size} usernames found`);
    }
  }

  const result = [...usernames];
  window.__followingList = result;

  console.log(`\nExtraction complete: ${result.length} usernames`);
  console.log("Access via: window.__followingList");
  console.log("Copy to clipboard: copy(window.__followingList)");

  return result;
})();

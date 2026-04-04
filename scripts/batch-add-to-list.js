/**
 * Batch Add Users to a Twitter/X List via GraphQL API
 *
 * Run this script in the browser DevTools console while logged in to X.
 * Navigate to any x.com page first (needed for auth cookies).
 *
 * Prerequisites:
 *   - You must have a Twitter List already created
 *   - You need the List ID (visible in the list URL)
 *   - window.__followingList must contain an array of usernames
 *     (use extract-following.js first, or set it manually)
 *
 * Usage:
 *   1. Set LIST_ID below to your list's ID
 *   2. Ensure window.__followingList is populated
 *   3. Paste this script in DevTools Console
 *   4. Monitor progress via window.__addProgress
 *
 * Rate limiting:
 *   - 400ms delay between requests
 *   - 2000ms pause after failures
 *   - 5000ms backoff on HTTP 429
 */

(async function batchAddToList() {
  // ============ CONFIGURATION ============
  const LIST_ID = "2040078195655909434"; // Your list ID
  const DELAY_MS = 400;
  const FAILURE_DELAY_MS = 2000;
  const RATE_LIMIT_DELAY_MS = 5000;
  // ========================================

  const usernames = window.__followingList;
  if (!usernames || !usernames.length) {
    console.error("No usernames found. Set window.__followingList first.");
    return;
  }

  const csrfToken = document.cookie
    .split(";")
    .find((c) => c.trim().startsWith("ct0="))
    ?.split("=")[1];

  if (!csrfToken) {
    console.error("CSRF token not found. Make sure you are logged in to X.");
    return;
  }

  const BEARER =
    "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";

  const headers = {
    authorization: `Bearer ${BEARER}`,
    "content-type": "application/json",
    "x-csrf-token": csrfToken,
    "x-twitter-active-user": "yes",
    "x-twitter-auth-type": "OAuth2Session",
  };

  const progress = {
    total: usernames.length,
    completed: 0,
    successful: 0,
    failed: 0,
    failures: [],
  };
  window.__addProgress = progress;

  async function getUserId(username) {
    const variables = JSON.stringify({ screen_name: username, withSafetyModeUserFields: true });
    const features = JSON.stringify({
      hidden_profile_subscriptions_enabled: true,
      rweb_tipjar_consumption_enabled: true,
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      highlights_tweets_tab_ui_enabled: true,
      responsive_web_twitter_article_notes_tab_enabled: true,
      subscriptions_feature_can_gift_premium: true,
      creator_subscriptions_tweet_preview_api_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      responsive_web_graphql_timeline_navigation_enabled: true,
    });

    const url = `https://x.com/i/api/graphql/xmU6X_CKVnQ5lSrCbXFDig/UserByScreenName?variables=${encodeURIComponent(variables)}&features=${encodeURIComponent(features)}`;

    const res = await fetch(url, { headers, credentials: "include" });

    if (res.status === 429) {
      console.warn(`Rate limited on lookup for @${username}, skipping`);
      return null;
    }

    if (!res.ok) {
      console.warn(`Failed to lookup @${username}: HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data?.data?.user?.result?.rest_id || null;
  }

  async function addToList(userId) {
    const res = await fetch("https://x.com/i/api/graphql/vWPi0CTMoPFsjsL6W4IynQ/ListAddMember", {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({
        variables: { listId: LIST_ID, userId },
        features: {
          responsive_web_graphql_exclude_directive_enabled: true,
          verified_phone_label_enabled: false,
          responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
          responsive_web_graphql_timeline_navigation_enabled: true,
        },
        queryId: "vWPi0CTMoPFsjsL6W4IynQ",
      }),
    });

    return res;
  }

  console.log(`Starting batch add: ${usernames.length} users → List ${LIST_ID}`);

  for (const username of usernames) {
    try {
      const userId = await getUserId(username);

      if (!userId) {
        progress.failed++;
        progress.failures.push({ username, reason: "no_id" });
        progress.completed++;
        await new Promise((r) => setTimeout(r, FAILURE_DELAY_MS));
        continue;
      }

      const res = await addToList(userId);

      if (res.status === 429) {
        console.warn(`Rate limited adding @${username}, backing off...`);
        await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY_MS));
        // Retry once
        const retry = await addToList(userId);
        if (retry.ok) {
          progress.successful++;
        } else {
          progress.failed++;
          progress.failures.push({ username, reason: `retry_${retry.status}` });
        }
      } else if (res.ok) {
        progress.successful++;
      } else {
        progress.failed++;
        progress.failures.push({ username, reason: `status_${res.status}` });
        await new Promise((r) => setTimeout(r, FAILURE_DELAY_MS));
      }
    } catch (err) {
      progress.failed++;
      progress.failures.push({ username, reason: err.message });
      await new Promise((r) => setTimeout(r, FAILURE_DELAY_MS));
    }

    progress.completed++;
    await new Promise((r) => setTimeout(r, DELAY_MS));

    if (progress.completed % 20 === 0) {
      console.log(
        `Progress: ${progress.completed}/${progress.total} (${progress.successful} ok, ${progress.failed} fail)`
      );
    }
  }

  console.log("\nBatch complete!");
  console.log(`  Total: ${progress.total}`);
  console.log(`  Success: ${progress.successful}`);
  console.log(`  Failed: ${progress.failed}`);

  if (progress.failures.length > 0) {
    console.log("  Failures:", progress.failures);
  }

  return progress;
})();

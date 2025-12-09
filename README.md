# NoGrok

Browser extension that removes Grokipedia results from major search engines for a cleaner, source-first search experience.

## Install (unpacked)

1. Clone this repo.
2. In Chrome/Edge/Brave, open `chrome://extensions`, enable Developer Mode, and choose **Load unpacked**.
3. Select the repo folder. The extension icon opens a popup to pick how Grokipedia links are treated.

## Behavior

- Supports Google, Bing, DuckDuckGo, Brave Search, and Startpage.
- Filters any result linking to Grokipedia (including subdomains).
- Modes: hide results entirely, gray them out, or leave them visible.
- Popup shows how many Grokipedia results were blocked on the current page and in total.
- Uses a `MutationObserver` to keep filtering dynamically loaded results.

## Support status

| Engine       | Status        | Notes                  |
|--------------|---------------|------------------------|
| DuckDuckGo   | ✅ Works      | Verified manually      |
| Google       | ⚠️ Needs check | Pending manual test    |
| Bing         | ⚠️ Needs check | Pending manual test    |
| Brave Search | ⚠️ Needs check | Pending manual test    |
| Startpage    | ⚠️ Needs check | Pending manual test    |

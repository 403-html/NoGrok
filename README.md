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

## TODO

- [x] Handling modes (hide/gray/keep) with pills and counter
- [x] Popup UI for mode selection and counts
- [ ] Package with icons
- [ ] Publishing to Chrome Web Store
- [ ] Publishing to Edge Add-ons
- [ ] Publishing to Firefox
- [ ] Publishing to Safari variants

## Support status

Search engines tested so far:

| Engine       | Status          | Notes               |
| :----------- | :-------------: | :------------------ |
| DuckDuckGo   | ✅ Works        | Verified manually   |
| Google       | ✅ Works        | Verified manually   |
| Bing         | ✅ Works        | Verified manually   |
| Brave Search | ✅ Works        | Verified manually |
| Startpage    | ✅ Works        | Pending manual test |

Browsers tested so far:

| Browser                 | Status               | Notes                    |
| :---------------------- | :------------------: | :----------------------- |
| Chrome / Chromium-based | ✅ Works             | Verified manually        |
| Firefox                 | 🔴 Needs development | Pending                  |
| Safari / WebKit-based   | 🔴 Needs development | Pending                  |
| Edge                    | 🔴 Needs development | Pending                  |
| Opera                   | 🔴 Needs development | Pending                  |

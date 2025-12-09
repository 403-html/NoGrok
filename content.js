const MODE_KEY = "nogrokHandlingMode";
const DEFAULT_MODE = "hide"; // hide | keep | gray
const FLAG_CLASS = "nogrok-flagged";
const GRAY_CLASS = "nogrok-gray";
const PILL_CLASS = "nogrok-pill";
const COUNT_KEY = "nogrokCount";
const TOTAL_KEY = "nogrokTotalCount";
const storageArea = (chrome.storage && chrome.storage.sync) || chrome.storage.local;
const storageAreaName = storageArea === chrome.storage.sync ? "sync" : "local";

let currentMode = DEFAULT_MODE;
let lastCount = 0;
let totalCount = 0;

const strategies = [
  {
    name: "google",
    matches: (host) => host.includes("google."),
    getContainer(anchor) {
      return anchor.closest("div.MjjYud, div.g, div[data-sokoban-container], div#search div[data-hveid]");
    }
  },
  {
    name: "bing",
    matches: (host) => host.includes("bing.com"),
    getContainer(anchor) {
      return anchor.closest("li.b_algo, li.b_ans, div.b_algo, li.b_srt");
    }
  },
  {
    name: "duckduckgo",
    matches: (host) => host.includes("duckduckgo.com"),
    getContainer(anchor) {
      return anchor.closest(
        "li[data-layout], article[data-testid='result'], article[data-nr], div.result, div.web-result"
      );
    }
  },
  {
    name: "brave",
    matches: (host) => host.includes("search.brave.com"),
    getContainer(anchor) {
      return anchor.closest(
        "div.snippet, div.snippet-card, div.result, div.result-wrapper, div.fdb, div.card"
      );
    }
  },
  {
    name: "startpage",
    matches: (host) => host.includes("startpage.com"),
    getContainer(anchor) {
      return anchor.closest(
        "div.w-gl__result, section.w-gl, div.result, li.result, div.w-gl__result__main, div.w-gl"
      );
    }
  },
  {
    name: "qwant",
    matches: (host) => host.includes("qwant.com"),
    getContainer(anchor) {
      const innerSelectors = [
        "div[data-testid='webResult']",
        "div._0IJFK[data-testid='webResult']",
        "div[data-testid='SERVariant-A']"
      ];
      let match = null;
      for (const sel of innerSelectors) {
        match = anchor.closest(sel);
        if (match) break;
      }
      const outer = (match || anchor).closest("div.iwb-detected");
      return outer || match;
    }
  }
];

const strategy = strategies.find((s) => s.matches(location.hostname)) || {
  name: "default",
  matches: () => true,
  getContainer: defaultContainer
};
const grokQuery = 'a[href*="grokipedia"], a[data-iwb-href*="grokipedia"]';
const REDIRECT_PARAM_KEYS = [
  "q",
  "url",
  "u",
  "target",
  "dest",
  "redirect",
  "rurl",
  "l",
  "lurl",
  "href",
  "to"
];
let stylesInjected = false;

async function loadMode() {
  return new Promise((resolve) => {
    storageArea.get({ [MODE_KEY]: DEFAULT_MODE }, (result) => {
      resolve(result?.[MODE_KEY] || DEFAULT_MODE);
    });
  });
}

async function loadTotal() {
  return new Promise((resolve) => {
    storageArea.get({ [TOTAL_KEY]: 0 }, (result) => {
      resolve(Number(result?.[TOTAL_KEY]) || 0);
    });
  });
}

function applyModeToNode(node) {
  if (!node || !(node instanceof HTMLElement)) return;

  if (!node.dataset.nogrokOriginalDisplay) {
    node.dataset.nogrokOriginalDisplay = node.style.display || "";
  }
  if (!node.dataset.nogrokOriginalOpacity) {
    node.dataset.nogrokOriginalOpacity = node.style.opacity || "";
  }
  if (!node.dataset.nogrokOriginalFilter) {
    node.dataset.nogrokOriginalFilter = node.style.filter || "";
  }

  removePill(node);
  node.classList.remove(GRAY_CLASS);

  if (currentMode === "hide") {
    node.style.display = "none";
    node.style.opacity = node.dataset.nogrokOriginalOpacity;
    node.style.filter = node.dataset.nogrokOriginalFilter;
  } else if (currentMode === "gray") {
    ensurePill(node);
    node.classList.add(GRAY_CLASS);
    node.style.display = node.dataset.nogrokOriginalDisplay;
    node.style.opacity = "0.45";
    node.style.filter = "grayscale(1)";
  } else {
    node.style.display = node.dataset.nogrokOriginalDisplay;
    node.style.opacity = node.dataset.nogrokOriginalOpacity;
    node.style.filter = node.dataset.nogrokOriginalFilter;
  }
}

function applyModeToAllFlagged() {
  const flagged = document.querySelectorAll(`.${FLAG_CLASS}`);
  flagged.forEach((node) => applyModeToNode(node));
}

function isGrokLink(anchor) {
  if (!anchor || anchor.tagName !== "A") return false;
  const targets = collectTargets(anchor);
  return targets.some((url) => url.hostname && url.hostname.toLowerCase().includes("grokipedia"));
}

function getContainer(anchor) {
  if (!(anchor instanceof HTMLElement)) return anchor?.parentElement || null;
  const container = strategy.getContainer(anchor);
  if (container) return container;
  if (strategy.name !== "default") return null;
  return defaultContainer(anchor);
}

function markResult(container) {
  if (!container) return;
  if (!container.classList.contains(FLAG_CLASS)) {
    container.classList.add(FLAG_CLASS);
  }
  applyModeToNode(container);
  updateCounter();
}

function scanForGrok(root) {
  if (!root || !(root instanceof HTMLElement || root instanceof Document || root instanceof DocumentFragment)) {
    return;
  }

  const anchors = new Set();
  if (root instanceof HTMLElement && isGrokLink(root)) {
    anchors.add(root);
  }
  root.querySelectorAll?.(grokQuery)?.forEach((anchor) => anchors.add(anchor));
  root.querySelectorAll?.("a[data-iwb-href], a[data-href], a[href]")?.forEach((anchor) => {
    anchors.add(anchor);
  });

  anchors.forEach((anchor) => {
    if (!isGrokLink(anchor)) return;
    const container = getContainer(anchor);
    markResult(container);
  });
}

function startObserver() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (isIgnorableNode(mutation.target)) continue;
      mutation.addedNodes.forEach((node) => {
        if (isIgnorableNode(node)) return;
        scanForGrok(node);
      });
    }
    updateCounter();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

async function init() {
  currentMode = await loadMode();
  totalCount = await loadTotal();
  lastCount = 0;
  storageArea.set({ [COUNT_KEY]: 0 });
  injectStyles();
  scanForGrok(document.body);
  updateCounter();
  startObserver();

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== storageAreaName) return;
    if (changes[MODE_KEY]?.newValue) {
      currentMode = changes[MODE_KEY].newValue;
      applyModeToAllFlagged();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

function defaultContainer(anchor) {
  return (
    anchor.closest("article") ||
    anchor.closest("li") ||
    anchor.closest("div") ||
    anchor.parentElement
  );
}

function injectStyles() {
  if (stylesInjected) return;
  const style = document.createElement("style");
  style.textContent = `
    .${PILL_CLASS} {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 9px;
      margin-top: 6px;
      margin-left: 0;
      background: linear-gradient(120deg, #0ea5e9 0%, #6366f1 50%, #a855f7 100%);
      color: #0b1224;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      line-height: 1.4;
      width: fit-content;
      letter-spacing: 0.02em;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
    }
    .${GRAY_CLASS} {
      text-decoration: line-through;
      text-decoration-thickness: 2px;
      text-decoration-color: #475569;
    }
  `;
  document.head.appendChild(style);
  stylesInjected = true;
}

function ensurePill(node) {
  let pill = node.querySelector(`.${PILL_CLASS}`);
  if (!pill) {
    pill = document.createElement("span");
    pill.className = PILL_CLASS;
    pill.textContent = "Filtered: Grokipedia";
    node.appendChild(pill);
  }
  return pill;
}

function removePill(node) {
  const pill = node.querySelector(`.${PILL_CLASS}`);
  if (pill) pill.remove();
}

function updateCounter() {
  const count = document.querySelectorAll(`.${FLAG_CLASS}`).length;
  if (count === lastCount) return;
  const delta = count - lastCount;
  lastCount = count;
  if (delta > 0) {
    totalCount += delta;
  }
  storageArea.set({ [COUNT_KEY]: count, [TOTAL_KEY]: totalCount });
}

function isIgnorableNode(node) {
  if (!(node instanceof HTMLElement)) return false;
  if (node.classList.contains(PILL_CLASS) || node.closest(`.${PILL_CLASS}`)) return true;
  return false;
}

function collectTargets(anchor) {
  const urls = [];

  function addUrl(value) {
    if (!value || typeof value !== "string") return;
    try {
      const url = new URL(value, location.href);
      urls.push(url);
    } catch (_) {
      // ignore
    }
  }

  addUrl(anchor.getAttribute("data-iwb-href"));
  addUrl(anchor.getAttribute("data-href"));
  addUrl(anchor.getAttribute("href"));

  try {
    addUrl(anchor.href);
  } catch (_) {
    // ignore
  }

  // inspect redirect params for embedded URLs
  urls.slice().forEach((url) => {
    if (!(url instanceof URL)) return;
    for (const [key, val] of url.searchParams.entries()) {
      if (!REDIRECT_PARAM_KEYS.includes(key.toLowerCase())) continue;
      addUrl(val);
      const decoded = base64Decode(val);
      addUrl(decoded);
    }
  });

  return urls;
}

function base64Decode(value) {
  if (!value || typeof value !== "string") return "";
  const cleaned = value.replace(/[^0-9a-zA-Z+/=]/g, "");
  if (cleaned.length < 12) return "";
  const padded = cleaned + "=".repeat((4 - (cleaned.length % 4)) % 4);
  try {
    return atob(padded);
  } catch {
    return "";
  }
}

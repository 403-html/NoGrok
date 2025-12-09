const MODE_KEY = "nogrokHandlingMode";
const DEFAULT_MODE = "hide";
const COUNT_KEY = "nogrokCount";
const TOTAL_KEY = "nogrokTotalCount";
const storageArea = (chrome.storage && chrome.storage.sync) || chrome.storage.local;

function setStatus(text) {
  const el = document.getElementById("status");
  if (el) {
    el.textContent = text;
  }
}

function getMode() {
  return new Promise((resolve) => {
    storageArea.get({ [MODE_KEY]: DEFAULT_MODE }, (result) => {
      resolve(result?.[MODE_KEY] || DEFAULT_MODE);
    });
  });
}

function getCount() {
  return new Promise((resolve) => {
    storageArea.get({ [COUNT_KEY]: 0, [TOTAL_KEY]: 0 }, (result) => {
      resolve({
        current: result?.[COUNT_KEY] || 0,
        total: result?.[TOTAL_KEY] || 0
      });
    });
  });
}

function saveMode(mode) {
  return new Promise((resolve) => {
    storageArea.set({ [MODE_KEY]: mode }, () => resolve());
  });
}

function bindInputs(currentMode) {
  document.querySelectorAll('input[name="handling"]').forEach((input) => {
    input.checked = input.value === currentMode;
    input.addEventListener("change", async (event) => {
      const mode = event.target.value;
      await saveMode(mode);
      setStatus(`Handling set to "${mode}".`);
      setTimeout(() => setStatus(""), 1200);
    });
  });
}

function renderCount(count) {
  const currentEl = document.getElementById("counter-current");
  const totalEl = document.getElementById("counter-total");
  if (currentEl) {
    currentEl.textContent = `Groks slain (this page): ${count.current}`;
  }
  if (totalEl) {
    totalEl.textContent = `Groks slain (total): ${count.total}`;
  }
}

async function init() {
  const mode = await getMode();
  let count = await getCount();
  bindInputs(mode);
  setStatus(`Current mode: ${mode}`);
  renderCount(count);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== (chrome.storage.sync ? "sync" : "local")) return;
    if (changes[COUNT_KEY] || changes[TOTAL_KEY]) {
      count = {
        current: changes[COUNT_KEY]?.newValue ?? count.current,
        total: changes[TOTAL_KEY]?.newValue ?? count.total
      };
      renderCount(count);
    }
  });
}

document.addEventListener("DOMContentLoaded", init);

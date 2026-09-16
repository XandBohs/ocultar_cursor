(function initializeCursorHider() {
  "use strict";

  const INSTANCE_KEY = "__cursorFullscreenHider";
  const INSTANCE_VERSION = "1.2.2";
  const HIDDEN_CLASS = "cursor-fullscreen-hidden";
  const VISIBLE_CLASS = "cursor-fullscreen-visible";
  const STYLE_ID = "cursor-fullscreen-style";
  const HIDE_EVENT = "cursor-fullscreen-extension:hide";
  const SHOW_EVENT = "cursor-fullscreen-extension:show";
  const FORCE_VISIBLE_EVENT = "cursor-fullscreen-extension:force-visible";
  const api = globalThis.browser ?? globalThis.chrome;
  const pointerPathElements = [];
  let currentMode = "normal";

  if (globalThis[INSTANCE_KEY]) {
    if (globalThis[INSTANCE_KEY].version === INSTANCE_VERSION) {
      globalThis[INSTANCE_KEY].refresh();
      return;
    }
    globalThis[INSTANCE_KEY].destroy();
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `html.${HIDDEN_CLASS}, html.${HIDDEN_CLASS} * { cursor: none !important; }
html.${VISIBLE_CLASS}, html.${VISIBLE_CLASS} * { cursor: auto !important; }`;
    (document.head || document.documentElement).appendChild(style);
  }

  function rememberPointerPath(event) {
    const path = typeof event.composedPath === "function" ? event.composedPath() : [event.target];
    for (const element of path) {
      if (element?.nodeType === 1 && !pointerPathElements.includes(element)) {
        pointerPathElements.push(element);
      }
    }

    if (pointerPathElements.length > 500) {
      pointerPathElements.splice(0, pointerPathElements.length - 500);
    }
    cursorStyler.applyAddedNodes(path);
  }

  const cursorStyler = CursorStyler.createCursorStyler({
    getRootElement() {
      return document.documentElement;
    },
    getExtraElements() {
      return pointerPathElements;
    },
    ensureDocumentStyle: ensureStyle,
    toggleRootClass(hidden) {
      document.documentElement?.classList.toggle(HIDDEN_CLASS, hidden);
    },
    toggleVisibleClass(visible) {
      document.documentElement?.classList.toggle(VISIBLE_CLASS, visible);
    }
  });

  function setCursorMode(mode) {
    if (currentMode === mode) {
      return;
    }
    currentMode = mode;
    if (mode === "hidden") {
      document.dispatchEvent(new Event(HIDE_EVENT));
      cursorStyler.setMode("hidden");
    } else if (mode === "visible") {
      document.dispatchEvent(new Event(FORCE_VISIBLE_EVENT));
      cursorStyler.setMode("visible");
    } else {
      cursorStyler.setMode("normal");
      document.dispatchEvent(new Event(SHOW_EVENT));
    }
  }

  document.addEventListener("pointermove", rememberPointerPath, { capture: true, passive: true });
  document.addEventListener("pointerdown", rememberPointerPath, { capture: true, passive: true });

  const playerObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        cursorStyler.applyAddedNodes(mutation.addedNodes);
      } else if (mutation.type === "attributes") {
        cursorStyler.applyAddedNodes([mutation.target]);
      }
    }
  });
  playerObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["style"], childList: true, subtree: true });

  const controller = CursorFullscreen.createFullscreenCursorController({
    addListener(type, listener) {
      document.addEventListener(type, listener, { capture: true, passive: true });
    },
    removeListener(type, listener) {
      document.removeEventListener(type, listener, { capture: true });
    },
    isFullscreen() {
      return Boolean(document.fullscreenElement);
    },
    setCursorMode,
    hideDelayMs: 4000
  });

  async function refresh() {
    try {
      const { allowedHosts = [] } = await api.storage.local.get("allowedHosts");
      const enabled = allowedHosts.some((host) => CursorHosts.hostMatches(location.hostname, host));
      controller.setEnabled(enabled);
    } catch {
      controller.setEnabled(false);
    }
  }

  function handleStorageChange(changes, areaName) {
    if (areaName === "local" && changes.allowedHosts) {
      refresh();
    }
  }

  api.storage.onChanged.addListener(handleStorageChange);
  controller.start();
  refresh();

  globalThis[INSTANCE_KEY] = {
    version: INSTANCE_VERSION,
    refresh,
    destroy() {
      api.storage.onChanged.removeListener(handleStorageChange);
      document.removeEventListener("pointermove", rememberPointerPath, { capture: true });
      document.removeEventListener("pointerdown", rememberPointerPath, { capture: true });
      playerObserver.disconnect();
      controller.stop();
      document.getElementById(STYLE_ID)?.remove();
      delete globalThis[INSTANCE_KEY];
    }
  };
})();

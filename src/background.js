if (typeof importScripts === "function" && !globalThis.CursorHosts) {
  importScripts("lib/hosts.js");
}

(function initializeBackground() {
  "use strict";

  const api = globalThis.browser ?? globalThis.chrome;
  const SCRIPT_ID = "cursor-fullscreen-sites";
  const MAIN_SCRIPT_ID = "cursor-fullscreen-main-world";
  let syncQueue = Promise.resolve();

  async function getAllowedHosts() {
    const { allowedHosts = [] } = await api.storage.local.get("allowedHosts");
    return allowedHosts;
  }

  async function replaceRegisteredScript() {
    const hosts = await getAllowedHosts();

    try {
      await api.scripting.unregisterContentScripts({ ids: [SCRIPT_ID, MAIN_SCRIPT_ID] });
    } catch {
      // Não havia registro anterior.
    }

    if (hosts.length === 0) {
      return;
    }

    const matches = CursorHosts.patternsForHosts(hosts);
    await api.scripting.registerContentScripts([
      {
        id: MAIN_SCRIPT_ID,
        matches,
        js: ["main-world.js"],
        runAt: "document_start",
        allFrames: false,
        world: "MAIN"
      },
      {
        id: SCRIPT_ID,
        matches,
        js: ["lib/hosts.js", "lib/fullscreen-controller.js", "lib/cursor-styler.js", "content.js"],
        runAt: "document_start",
        allFrames: false,
        world: "ISOLATED"
      }
    ]);
  }

  function syncRegisteredScript() {
    syncQueue = syncQueue.then(replaceRegisteredScript, replaceRegisteredScript);
    return syncQueue;
  }

  async function injectIntoTab(tabId) {
    if (!Number.isInteger(tabId)) {
      throw new Error("INVALID_TAB");
    }

    await api.scripting.executeScript({
      target: { tabId },
      files: ["main-world.js"],
      world: "MAIN"
    });

    await api.scripting.executeScript({
      target: { tabId },
      files: ["lib/hosts.js", "lib/fullscreen-controller.js", "lib/cursor-styler.js", "content.js"],
      world: "ISOLATED"
    });
  }

  api.runtime.onInstalled.addListener(() => {
    syncRegisteredScript();
  });

  api.runtime.onStartup.addListener(() => {
    syncRegisteredScript();
  });

  api.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.allowedHosts) {
      syncRegisteredScript();
    }
  });

  api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || !["SYNC_REGISTRATIONS", "INJECT_TAB"].includes(message.type)) {
      return false;
    }

    const operation = message.type === "SYNC_REGISTRATIONS"
      ? syncRegisteredScript()
      : injectIntoTab(message.tabId);

    operation
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  });

  syncRegisteredScript();
})();

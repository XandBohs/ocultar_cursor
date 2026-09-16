(function initializeClosedShadowBridge() {
  "use strict";

  const INSTANCE_KEY = "__cursorFullscreenClosedShadowBridgeV2";
  const HIDE_EVENT = "cursor-fullscreen-extension:hide";
  const SHOW_EVENT = "cursor-fullscreen-extension:show";
  const FORCE_VISIBLE_EVENT = "cursor-fullscreen-extension:force-visible";

  if (globalThis[INSTANCE_KEY]) {
    return;
  }

  const closedRoots = new Set();
  const previousCursorStyles = new Map();
  const originalAttachShadow = Element.prototype.attachShadow;
  let mode = "normal";

  function forEachElement(root, callback) {
    if (!root) {
      return;
    }

    if (root.nodeType === 1) {
      callback(root);
      if (root.shadowRoot) {
        forEachElement(root.shadowRoot, callback);
      }
    }

    for (const child of root.children || []) {
      forEachElement(child, callback);
    }
  }

  function styleElement(element) {
    if (!element?.style?.setProperty) {
      return;
    }

    if (!previousCursorStyles.has(element)) {
      previousCursorStyles.set(element, {
        value: element.style.getPropertyValue("cursor"),
        priority: element.style.getPropertyPriority("cursor")
      });
    }

    const cursor = mode === "hidden" ? "none" : "auto";
    if (element.style.getPropertyValue("cursor") !== cursor || element.style.getPropertyPriority("cursor") !== "important") {
      element.style.setProperty("cursor", cursor, "important");
    }
  }

  function restoreStyles() {
    for (const [element, previous] of previousCursorStyles) {
      if (!element?.style) {
        continue;
      }

      if (previous.value) {
        element.style.setProperty("cursor", previous.value, previous.priority);
      } else {
        element.style.removeProperty("cursor");
      }
    }
    previousCursorStyles.clear();
  }

  function setMode(nextMode) {
    mode = nextMode;
    if (mode === "normal") {
      restoreStyles();
      return;
    }
    for (const root of closedRoots) {
      forEachElement(root, styleElement);
    }
  }

  function attachShadow(init) {
    const shadowRoot = Reflect.apply(originalAttachShadow, this, arguments);
    if (init?.mode === "closed") {
      closedRoots.add(shadowRoot);
      addedNodesObserver.observe(shadowRoot, { attributes: true, attributeFilter: ["style"], childList: true, subtree: true });
      if (mode !== "normal") {
        forEachElement(shadowRoot, styleElement);
      }
    }
    return shadowRoot;
  }

  Object.defineProperty(Element.prototype, "attachShadow", {
    configurable: true,
    enumerable: false,
    writable: true,
    value: attachShadow
  });

  const addedNodesObserver = new MutationObserver((mutations) => {
    if (mode === "normal") {
      return;
    }
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          forEachElement(node, styleElement);
        }
      } else if (mutation.type === "attributes") {
        forEachElement(mutation.target, styleElement);
      }
    }
  });

  document.addEventListener(HIDE_EVENT, () => setMode("hidden"));
  document.addEventListener(SHOW_EVENT, () => setMode("normal"));
  document.addEventListener(FORCE_VISIBLE_EVENT, () => setMode("visible"));
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      setMode("normal");
    }
  });

  globalThis[INSTANCE_KEY] = true;
})();

(function exposeCursorStyler(root, factory) {
  const exported = factory();
  root.CursorStyler = exported;

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createCursorStylerLibrary() {
  "use strict";

  function createCursorStyler(options) {
    const {
      getRootElement,
      getExtraElements = () => [],
      toggleRootClass,
      toggleVisibleClass = () => {},
      ensureDocumentStyle = () => {}
    } = options;

    const previousCursorStyles = new Map();
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
      if (!["normal", "visible", "hidden"].includes(nextMode)) {
        return;
      }
      mode = nextMode;
      toggleRootClass(mode === "hidden");
      toggleVisibleClass(mode === "visible");

      if (mode === "normal") {
        restoreStyles();
        return;
      }

      ensureDocumentStyle();
      forEachElement(getRootElement(), styleElement);
      for (const element of getExtraElements()) {
        styleElement(element);
      }
    }

    function applyAddedNodes(nodes) {
      if (mode === "normal") {
        return;
      }

      for (const node of nodes) {
        forEachElement(node, styleElement);
      }
      for (const element of getExtraElements()) {
        styleElement(element);
      }
    }

    return {
      applyAddedNodes,
      setMode,
      hide: () => setMode("hidden"),
      show: () => setMode("normal")
    };
  }

  return { createCursorStyler };
});

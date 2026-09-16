const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function createStyle() {
  const values = new Map();
  return {
    getPropertyValue: (name) => values.get(name)?.value || "",
    getPropertyPriority: (name) => values.get(name)?.priority || "",
    setProperty(name, value, priority = "") {
      values.set(name, { value, priority });
    },
    removeProperty(name) {
      values.delete(name);
    }
  };
}

test("a ponte alcança e restaura elementos em shadow roots fechados", () => {
  class FakeElement {
    constructor() {
      this.nodeType = 1;
      this.children = [];
      this.shadowRoot = null;
      this.style = createStyle();
    }

    attachShadow(init) {
      const root = { nodeType: 11, mode: init.mode, children: [] };
      if (init.mode === "open") {
        this.shadowRoot = root;
      }
      return root;
    }
  }

  const document = new EventTarget();
  document.fullscreenElement = {};
  document.documentElement = new FakeElement();
  class FakeMutationObserver {
    observe() {}
  }
  const source = fs.readFileSync(require.resolve("../src/main-world.js"), "utf8");
  vm.runInNewContext(source, {
    document,
    Element: FakeElement,
    Event,
    Map,
    MutationObserver: FakeMutationObserver,
    Reflect,
    Set
  });

  const host = new FakeElement();
  const closedRoot = host.attachShadow({ mode: "closed" });
  const control = new FakeElement();
  control.style.setProperty("cursor", "pointer", "important");
  closedRoot.children.push(control);

  document.dispatchEvent(new Event("cursor-fullscreen-extension:hide"));
  assert.equal(control.style.getPropertyValue("cursor"), "none");

  document.dispatchEvent(new Event("cursor-fullscreen-extension:force-visible"));
  assert.equal(control.style.getPropertyValue("cursor"), "auto");

  document.dispatchEvent(new Event("cursor-fullscreen-extension:hide"));
  assert.equal(control.style.getPropertyValue("cursor"), "none");

  document.dispatchEvent(new Event("cursor-fullscreen-extension:show"));
  assert.equal(control.style.getPropertyValue("cursor"), "pointer");
  assert.equal(control.style.getPropertyPriority("cursor"), "important");
});

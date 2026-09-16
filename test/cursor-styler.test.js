const test = require("node:test");
const assert = require("node:assert/strict");
const { createCursorStyler } = require("../src/lib/cursor-styler.js");

function createElement(cursor = "", priority = "") {
  const values = new Map(cursor ? [["cursor", { value: cursor, priority }]] : []);
  return {
    nodeType: 1,
    children: [],
    shadowRoot: null,
    style: {
      getPropertyValue(name) {
        return values.get(name)?.value || "";
      },
      getPropertyPriority(name) {
        return values.get(name)?.priority || "";
      },
      setProperty(name, value, nextPriority = "") {
        values.set(name, { value, priority: nextPriority });
      },
      removeProperty(name) {
        values.delete(name);
      }
    }
  };
}

test("oculta elementos no documento e em shadow roots abertos", () => {
  const root = createElement();
  const host = createElement("pointer");
  const shadowChild = createElement("default", "important");
  host.shadowRoot = { nodeType: 11, children: [shadowChild] };
  root.children.push(host);

  const styler = createCursorStyler({
    getRootElement: () => root,
    toggleRootClass() {}
  });

  styler.hide();
  assert.equal(root.style.getPropertyValue("cursor"), "none");
  assert.equal(host.style.getPropertyValue("cursor"), "none");
  assert.equal(shadowChild.style.getPropertyValue("cursor"), "none");

  styler.show();
  assert.equal(root.style.getPropertyValue("cursor"), "");
  assert.equal(host.style.getPropertyValue("cursor"), "pointer");
  assert.equal(shadowChild.style.getPropertyValue("cursor"), "default");
  assert.equal(shadowChild.style.getPropertyPriority("cursor"), "important");
});

test("alcança o caminho do ponteiro e novos elementos durante o modo oculto", () => {
  const root = createElement();
  const closedShadowTarget = createElement("pointer");
  const addedElement = createElement();
  const styler = createCursorStyler({
    getRootElement: () => root,
    getExtraElements: () => [closedShadowTarget],
    toggleRootClass() {}
  });

  styler.hide();
  styler.applyAddedNodes([addedElement]);

  assert.equal(closedShadowTarget.style.getPropertyValue("cursor"), "none");
  assert.equal(addedElement.style.getPropertyValue("cursor"), "none");

  styler.show();
  assert.equal(closedShadowTarget.style.getPropertyValue("cursor"), "pointer");
  assert.equal(addedElement.style.getPropertyValue("cursor"), "");
});

test("mantém o cursor visível durante a espera mesmo se o player definir cursor none", () => {
  const root = createElement("none", "important");
  const player = createElement("none", "important");
  root.children.push(player);
  const styler = createCursorStyler({
    getRootElement: () => root,
    toggleRootClass() {}
  });

  styler.setMode("visible");
  assert.equal(root.style.getPropertyValue("cursor"), "auto");
  assert.equal(player.style.getPropertyValue("cursor"), "auto");

  player.style.setProperty("cursor", "none", "important");
  styler.applyAddedNodes([player]);
  assert.equal(player.style.getPropertyValue("cursor"), "auto");

  styler.setMode("hidden");
  assert.equal(player.style.getPropertyValue("cursor"), "none");
  styler.setMode("normal");
  assert.equal(root.style.getPropertyValue("cursor"), "none");
  assert.equal(player.style.getPropertyValue("cursor"), "none");
});

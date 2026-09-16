const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

test("reinjeção substitui uma instância antiga em vez de reutilizar seu controlador", async () => {
  const calls = { oldDestroy: 0, oldRefresh: 0, start: 0, newRefresh: 0 };
  const document = {
    documentElement: { classList: { toggle() {} } },
    addEventListener() {},
    removeEventListener() {},
    getElementById() { return null; }
  };
  const storageListeners = { addListener() {}, removeListener() {} };
  const context = {
    document,
    location: { hostname: "www.disneyplus.com" },
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
    CursorStyler: {
      createCursorStyler() {
        return { hide() {}, show() {}, applyAddedNodes() {} };
      }
    },
    CursorFullscreen: {
      createFullscreenCursorController() {
        return {
          start() { calls.start += 1; },
          stop() {},
          setEnabled() { calls.newRefresh += 1; }
        };
      }
    },
    CursorHosts: { hostMatches: () => true },
    chrome: {
      storage: {
        local: { get: async () => ({ allowedHosts: ["disneyplus.com"] }) },
        onChanged: storageListeners
      }
    },
    __cursorFullscreenHider: {
      refresh() { calls.oldRefresh += 1; },
      destroy() {
        calls.oldDestroy += 1;
        delete context.__cursorFullscreenHider;
      }
    }
  };

  const source = fs.readFileSync(require.resolve("../src/content.js"), "utf8");
  vm.runInNewContext(source, context);
  await new Promise(setImmediate);

  assert.equal(calls.oldDestroy, 1);
  assert.equal(calls.oldRefresh, 0);
  assert.equal(calls.start, 1);
  assert.equal(calls.newRefresh, 1);
  assert.equal(context.__cursorFullscreenHider.version, "1.2.2");

  vm.runInNewContext(source, context);
  await new Promise(setImmediate);
  assert.equal(calls.oldDestroy, 1);
  assert.equal(calls.start, 1);
  assert.equal(calls.newRefresh, 2);
});

const test = require("node:test");
const assert = require("node:assert/strict");
const { createFullscreenCursorController } = require("../src/lib/fullscreen-controller.js");

function createHarness() {
  let fullscreen = false;
  let mode = "normal";
  let now = 0;
  let nextId = 1;
  const timers = new Map();
  const listeners = new Map();

  const controller = createFullscreenCursorController({
    addListener(type, listener) {
      listeners.set(type, listener);
    },
    removeListener(type) {
      listeners.delete(type);
    },
    isFullscreen() {
      return fullscreen;
    },
    setCursorMode(value) {
      mode = value;
    },
    setTimer(callback, delay) {
      const id = nextId++;
      timers.set(id, { callback, at: now + delay });
      return id;
    },
    clearTimer(id) {
      timers.delete(id);
    },
    hideDelayMs: 4000
  });

  function advance(milliseconds) {
    now += milliseconds;
    const due = [...timers.entries()]
      .filter(([, timer]) => timer.at <= now)
      .sort((a, b) => a[1].at - b[1].at);
    for (const [id, timer] of due) {
      timers.delete(id);
      timer.callback();
    }
  }

  return {
    controller,
    advance,
    emit(type) {
      listeners.get(type)?.();
    },
    get hidden() {
      return mode === "hidden";
    },
    get mode() {
      return mode;
    },
    get timerCount() {
      return timers.size;
    },
    set fullscreen(value) {
      fullscreen = value;
    }
  };
}

test("oculta exatamente quatro segundos após entrar em tela cheia", () => {
  const harness = createHarness();
  harness.controller.start();
  harness.controller.setEnabled(true);
  harness.advance(5000);
  assert.equal(harness.hidden, false);

  harness.fullscreen = true;
  harness.emit("fullscreenchange");
  assert.equal(harness.mode, "visible");
  harness.advance(3999);
  assert.equal(harness.hidden, false);
  harness.advance(1);
  assert.equal(harness.hidden, true);
});

test("atividade restaura o cursor e reinicia os quatro segundos", () => {
  const harness = createHarness();
  harness.fullscreen = true;
  harness.controller.start();
  harness.controller.setEnabled(true);
  harness.advance(4000);
  assert.equal(harness.hidden, true);

  harness.emit("pointermove");
  assert.equal(harness.hidden, false);
  assert.equal(harness.mode, "visible");
  harness.advance(3000);
  harness.emit("pointermove");
  harness.advance(3999);
  assert.equal(harness.hidden, false);
  harness.advance(1);
  assert.equal(harness.hidden, true);
});

test("teclado e cliques também reiniciam a contagem", () => {
  const harness = createHarness();
  harness.fullscreen = true;
  harness.controller.start();
  harness.controller.setEnabled(true);
  harness.advance(2000);
  harness.emit("keydown");
  harness.advance(2000);
  harness.emit("pointerdown");
  harness.advance(3999);
  assert.equal(harness.hidden, false);
  harness.advance(1);
  assert.equal(harness.hidden, true);
});

test("sair da tela cheia ou desativar cancela o temporizador e mostra o cursor", () => {
  const harness = createHarness();
  harness.fullscreen = true;
  harness.controller.start();
  harness.controller.setEnabled(true);
  harness.advance(4000);
  assert.equal(harness.hidden, true);

  harness.fullscreen = false;
  harness.emit("fullscreenchange");
  assert.equal(harness.hidden, false);
  assert.equal(harness.mode, "normal");
  assert.equal(harness.timerCount, 0);

  harness.fullscreen = true;
  harness.emit("fullscreenchange");
  harness.controller.setEnabled(false);
  assert.equal(harness.timerCount, 0);
  harness.advance(5000);
  assert.equal(harness.hidden, false);
  harness.controller.stop();
});

test("iniciar duas vezes não duplica listeners nem temporizadores", () => {
  const harness = createHarness();
  harness.fullscreen = true;
  harness.controller.start();
  harness.controller.start();
  harness.controller.setEnabled(true);
  assert.equal(harness.timerCount, 1);
  harness.emit("pointermove");
  assert.equal(harness.timerCount, 1);
});

(function exposeController(root, factory) {
  const exported = factory();
  root.CursorFullscreen = exported;

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createControllerLibrary() {
  "use strict";

  function createFullscreenCursorController(options) {
    const {
      addListener,
      removeListener,
      isFullscreen,
      setCursorMode,
      setTimer = setTimeout,
      clearTimer = clearTimeout,
      hideDelayMs = 4000
    } = options;

    let enabled = false;
    let started = false;
    let timerId = null;

    function cancelPendingHide() {
      if (timerId !== null) {
        clearTimer(timerId);
        timerId = null;
      }
    }

    function scheduleHide() {
      cancelPendingHide();

      if (!enabled || !isFullscreen()) {
        setCursorMode("normal");
        return;
      }

      setCursorMode("visible");
      timerId = setTimer(() => {
        timerId = null;
        if (enabled && isFullscreen()) {
          setCursorMode("hidden");
        }
      }, hideDelayMs);
    }

    function handleActivity() {
      scheduleHide();
    }

    function handleFullscreenChange() {
      scheduleHide();
    }

    function start() {
      if (started) {
        return;
      }
      started = true;
      for (const type of ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"]) {
        addListener(type, handleActivity);
      }
      addListener("fullscreenchange", handleFullscreenChange);
      scheduleHide();
    }

    function stop() {
      if (started) {
        for (const type of ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"]) {
          removeListener(type, handleActivity);
        }
        removeListener("fullscreenchange", handleFullscreenChange);
      }
      started = false;
      enabled = false;
      cancelPendingHide();
      setCursorMode("normal");
    }

    function setEnabled(nextEnabled) {
      enabled = Boolean(nextEnabled);
      scheduleHide();
    }

    return {
      setEnabled,
      start,
      stop
    };
  }

  return { createFullscreenCursorController };
});

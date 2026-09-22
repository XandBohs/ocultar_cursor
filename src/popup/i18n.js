(function exposePopupI18n(root, factory) {
  const exported = factory();
  root.CursorPopupI18n = exported;

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createPopupI18nLibrary() {
  "use strict";

  const ERROR_MESSAGE_KEYS = {
    DUPLICATE_HOST: "errorDuplicateHost",
    EMPTY_URL: "errorEmptyUrl",
    INVALID_URL: "errorInvalidUrl",
    UNSUPPORTED_PROTOCOL: "errorUnsupportedProtocol",
    PERMISSION_DENIED: "errorPermissionDenied",
    REGISTRATION_FAILED: "errorRegistrationFailed",
    INJECTION_FAILED: "errorInjectionFailed"
  };

  function createLocalizer(i18n, document) {
    function message(key, substitutions) {
      return i18n.getMessage(key, substitutions) || key;
    }

    function localizeDocument() {
      const uiLanguage = i18n.getUILanguage?.() || "en";
      document.documentElement.lang = uiLanguage.replaceAll("_", "-");

      document.querySelectorAll("[data-i18n]").forEach((element) => {
        element.textContent = message(element.dataset.i18n);
      });

      document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
        element.placeholder = message(element.dataset.i18nPlaceholder);
      });
    }

    function countLabel(count) {
      return message(count === 1 ? "siteCountOne" : "siteCountMany", String(count));
    }

    function errorMessage(error) {
      const errorCode = error?.message || String(error);
      const messageKey = ERROR_MESSAGE_KEYS[errorCode];
      return messageKey
        ? message(messageKey)
        : message("errorUnknown", errorCode);
    }

    return {
      countLabel,
      errorMessage,
      localizeDocument,
      message
    };
  }

  return { createLocalizer };
});

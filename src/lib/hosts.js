(function exposeHosts(root, factory) {
  const exported = factory();
  root.CursorHosts = exported;

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createHostsLibrary() {
  "use strict";

  const SUPPORTED_PROTOCOLS = new Set(["http:", "https:"]);

  function parseUrl(value) {
    const input = String(value ?? "").trim();
    if (!input) {
      throw new Error("EMPTY_URL");
    }

    const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(input);
    let url;

    try {
      url = new URL(hasScheme ? input : `https://${input}`);
    } catch {
      throw new Error("INVALID_URL");
    }

    if (!SUPPORTED_PROTOCOLS.has(url.protocol)) {
      throw new Error("UNSUPPORTED_PROTOCOL");
    }

    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    if (!host || !isValidHost(host)) {
      throw new Error("INVALID_URL");
    }

    return { host, url };
  }

  function isValidHost(host) {
    if (host === "localhost") {
      return true;
    }

    if (host.startsWith("[") && host.endsWith("]")) {
      return /^[\[\]0-9a-f:.]+$/i.test(host);
    }

    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
      return host.split(".").every((part) => Number(part) <= 255);
    }

    return host.length <= 253 && host.split(".").every((label) => (
      label.length > 0 &&
      label.length <= 63 &&
      /^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(label)
    ));
  }

  function normalizeHost(value) {
    return parseUrl(value).host;
  }

  function isExactOnlyHost(host) {
    return host === "localhost" || host.startsWith("[") || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
  }

  function patternsForHost(host) {
    const normalized = normalizeHost(host);
    if (isExactOnlyHost(normalized)) {
      return [
        `http://${normalized}/*`,
        `https://${normalized}/*`
      ];
    }

    return [
      `http://${normalized}/*`,
      `https://${normalized}/*`,
      `http://*.${normalized}/*`,
      `https://*.${normalized}/*`
    ];
  }

  function patternsForHosts(hosts) {
    return [...new Set(hosts.flatMap(patternsForHost))];
  }

  function hostMatches(currentHost, allowedHost) {
    const current = String(currentHost ?? "").toLowerCase();
    const allowed = String(allowedHost ?? "").toLowerCase();
    return current === allowed || current.endsWith(`.${allowed}`);
  }

  function addAllowedHost(hosts, value) {
    const normalized = normalizeHost(value);
    if (hosts.includes(normalized)) {
      throw new Error("DUPLICATE_HOST");
    }
    return [...hosts, normalized];
  }

  function removeAllowedHost(hosts, host) {
    return hosts.filter((item) => item !== host);
  }

  return {
    addAllowedHost,
    hostMatches,
    normalizeHost,
    parseUrl,
    patternsForHost,
    patternsForHosts,
    removeAllowedHost
  };
});

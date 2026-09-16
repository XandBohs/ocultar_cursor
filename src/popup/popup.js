(function initializePopup() {
  "use strict";

  const api = globalThis.browser ?? globalThis.chrome;
  const elements = {
    addCurrent: document.getElementById("add-current"),
    currentHost: document.getElementById("current-host"),
    emptyState: document.getElementById("empty-state"),
    form: document.getElementById("add-form"),
    input: document.getElementById("site-input"),
    list: document.getElementById("site-list"),
    siteCount: document.getElementById("site-count"),
    status: document.getElementById("status")
  };

  let allowedHosts = [];
  let activeTab = null;
  let activeHost = null;

  function setStatus(message = "", kind = "info") {
    elements.status.textContent = message;
    elements.status.dataset.kind = kind;
  }

  function errorMessage(error) {
    const messages = {
      DUPLICATE_HOST: "Este domínio já está na lista.",
      EMPTY_URL: "Digite um domínio ou link.",
      INVALID_URL: "Digite um domínio ou link válido.",
      UNSUPPORTED_PROTOCOL: "Esta página não aceita extensões. Use um site HTTP ou HTTPS.",
      PERMISSION_DENIED: "A permissão para este domínio não foi concedida.",
      REGISTRATION_FAILED: "Não foi possível ativar a extensão neste domínio.",
      INJECTION_FAILED: "O site foi adicionado. Recarregue a página para ativar a extensão."
    };
    return messages[error.message] || `Não foi possível concluir a ação: ${error.message}`;
  }

  function render() {
    elements.list.replaceChildren();
    elements.emptyState.hidden = allowedHosts.length > 0;
    elements.siteCount.textContent = `${allowedHosts.length} ${allowedHosts.length === 1 ? "site" : "sites"}`;

    allowedHosts.forEach((host) => {
      const item = document.createElement("li");
      item.className = "site-item";

      const name = document.createElement("span");
      name.className = "site-name";
      name.textContent = host;
      name.title = host;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove-button";
      remove.textContent = "Remover";
      remove.setAttribute("aria-label", `Remover ${host}`);
      remove.addEventListener("click", () => removeHost(host));

      item.append(name, remove);
      elements.list.appendChild(item);
    });

    const currentAlreadyAdded = activeHost && allowedHosts.some((host) => CursorHosts.hostMatches(activeHost, host));
    elements.addCurrent.disabled = !activeHost || currentAlreadyAdded;
    elements.addCurrent.textContent = currentAlreadyAdded ? "Site já adicionado" : "Adicionar site atual";
  }

  function sendMessage(message) {
    return api.runtime.sendMessage(message);
  }

  async function saveHosts(nextHosts) {
    const previousHosts = allowedHosts;
    await api.storage.local.set({ allowedHosts: nextHosts });

    try {
      const response = await sendMessage({ type: "SYNC_REGISTRATIONS" });
      if (!response?.ok) {
        throw new Error("REGISTRATION_FAILED");
      }
    } catch (error) {
      await api.storage.local.set({ allowedHosts: previousHosts });
      throw error.message === "REGISTRATION_FAILED"
        ? error
        : new Error("REGISTRATION_FAILED");
    }

    allowedHosts = nextHosts;
    render();
  }

  async function requestHostPermission(host) {
    const granted = await api.permissions.request({
      origins: CursorHosts.patternsForHost(host)
    });

    if (!granted) {
      throw new Error("PERMISSION_DENIED");
    }
  }

  async function addHost(value) {
    setStatus();
    let host = null;
    let saved = false;

    try {
      const nextHosts = CursorHosts.addAllowedHost(allowedHosts, value);
      host = nextHosts.at(-1);
      await requestHostPermission(host);
      await saveHosts(nextHosts);
      saved = true;

      if (activeTab?.id && activeHost && CursorHosts.hostMatches(activeHost, host)) {
        const response = await sendMessage({ type: "INJECT_TAB", tabId: activeTab.id });
        if (!response?.ok) {
          throw new Error("INJECTION_FAILED");
        }
      }

      elements.input.value = "";
      setStatus(`${host} foi adicionado.`);
    } catch (error) {
      if (host && !saved) {
        await api.permissions.remove({ origins: CursorHosts.patternsForHost(host) }).catch(() => {});
      }
      setStatus(errorMessage(error), "error");
    }
  }

  async function removeHost(host) {
    setStatus();
    const nextHosts = CursorHosts.removeAllowedHost(allowedHosts, host);

    try {
      await saveHosts(nextHosts);
      await api.permissions.remove({ origins: CursorHosts.patternsForHost(host) });
      setStatus(`${host} foi removido.`);
    } catch (error) {
      setStatus(errorMessage(error), "error");
    }
  }

  async function load() {
    const [{ allowedHosts: storedHosts = [] }, tabs] = await Promise.all([
      api.storage.local.get("allowedHosts"),
      api.tabs.query({ active: true, currentWindow: true })
    ]);

    allowedHosts = storedHosts;
    activeTab = tabs[0] || null;

    try {
      activeHost = CursorHosts.normalizeHost(activeTab?.url || "");
      elements.currentHost.textContent = activeHost;
      elements.currentHost.title = activeHost;
    } catch {
      activeHost = null;
      elements.currentHost.textContent = "Página não compatível";
    }

    render();
  }

  elements.addCurrent.addEventListener("click", () => addHost(activeTab?.url || ""));
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    addHost(elements.input.value);
  });

  load().catch(() => {
    elements.currentHost.textContent = "Não foi possível ler a aba";
    setStatus("Não foi possível carregar a configuração.", "error");
  });
})();

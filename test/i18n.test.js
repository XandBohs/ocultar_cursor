const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createLocalizer } = require("../src/popup/i18n.js");

const sourceDirectory = path.resolve(__dirname, "..", "src");
const localeDirectories = ["en", "pt_BR"];

function readJson(...segments) {
  return JSON.parse(fs.readFileSync(path.join(...segments), "utf8"));
}

function createCatalogApi(catalog, uiLanguage) {
  return {
    getUILanguage: () => uiLanguage,
    getMessage(key, substitutions = []) {
      const entry = catalog[key];
      if (!entry) {
        return "";
      }

      const values = Array.isArray(substitutions) ? substitutions : [substitutions];
      let output = entry.message;
      Object.entries(entry.placeholders || {}).forEach(([name, placeholder]) => {
        const index = Number(placeholder.content.slice(1)) - 1;
        output = output.replaceAll(`$${name.toUpperCase()}$`, values[index]);
      });
      return output;
    }
  };
}

test("catálogos em inglês e português possuem as mesmas chaves", () => {
  const catalogs = localeDirectories.map((locale) => (
    readJson(sourceDirectory, "_locales", locale, "messages.json")
  ));

  assert.deepEqual(Object.keys(catalogs[1]).sort(), Object.keys(catalogs[0]).sort());
  for (const catalog of catalogs) {
    for (const [key, entry] of Object.entries(catalog)) {
      assert.equal(typeof entry.message, "string", `${key} precisa ter uma mensagem`);
      assert.notEqual(entry.message, "", `${key} não pode estar vazio`);
    }
  }
});

test("manifests usam inglês como padrão e referenciam mensagens existentes", () => {
  const englishCatalog = readJson(sourceDirectory, "_locales", "en", "messages.json");

  for (const target of ["chromium", "firefox"]) {
    const manifest = readJson(sourceDirectory, "manifests", `${target}.json`);
    assert.equal(manifest.default_locale, "en");

    for (const value of [manifest.name, manifest.short_name, manifest.description, manifest.action.default_title]) {
      const match = /^__MSG_([A-Za-z0-9_]+)__$/.exec(value);
      assert.ok(match, `${target}: ${value} deve ser uma referência i18n`);
      assert.ok(englishCatalog[match[1]], `${target}: mensagem ${match[1]} não existe`);
    }
  }
});

test("localiza textos estáticos, idioma e placeholder do popup", () => {
  const catalog = readJson(sourceDirectory, "_locales", "pt_BR", "messages.json");
  const textElement = { dataset: { i18n: "authorizedSitesTitle" }, textContent: "" };
  const inputElement = { dataset: { i18nPlaceholder: "siteInputPlaceholder" }, placeholder: "" };
  const document = {
    documentElement: { lang: "" },
    querySelectorAll(selector) {
      return selector === "[data-i18n]" ? [textElement] : [inputElement];
    }
  };

  createLocalizer(createCatalogApi(catalog, "pt-BR"), document).localizeDocument();

  assert.equal(document.documentElement.lang, "pt-BR");
  assert.equal(textElement.textContent, "Sites autorizados");
  assert.equal(inputElement.placeholder, "disneyplus.com");
});

test("formata contadores, mensagens dinâmicas, acessibilidade e erros nos dois idiomas", () => {
  const cases = [
    {
      locale: "en",
      language: "en-US",
      expected: {
        one: "1 site",
        many: "2 sites",
        remove: "Remove example.com",
        added: "example.com was added.",
        error: "This domain is already on the list."
      }
    },
    {
      locale: "pt_BR",
      language: "pt-BR",
      expected: {
        one: "1 site",
        many: "2 sites",
        remove: "Remover example.com",
        added: "example.com foi adicionado.",
        error: "Este domínio já está na lista."
      }
    }
  ];

  for (const { locale, language, expected } of cases) {
    const catalog = readJson(sourceDirectory, "_locales", locale, "messages.json");
    const localizer = createLocalizer(createCatalogApi(catalog, language), {
      documentElement: {},
      querySelectorAll: () => []
    });

    assert.equal(localizer.countLabel(1), expected.one);
    assert.equal(localizer.countLabel(2), expected.many);
    assert.equal(localizer.message("removeHostAria", "example.com"), expected.remove);
    assert.equal(localizer.message("hostAdded", "example.com"), expected.added);
    assert.equal(localizer.errorMessage(new Error("DUPLICATE_HOST")), expected.error);
  }
});

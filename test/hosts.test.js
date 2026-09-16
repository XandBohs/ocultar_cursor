const test = require("node:test");
const assert = require("node:assert/strict");
const {
  addAllowedHost,
  hostMatches,
  normalizeHost,
  patternsForHost,
  removeAllowedHost
} = require("../src/lib/hosts.js");

test("normaliza links e ignora caminho, query e fragmento", () => {
  assert.equal(
    normalizeHost(" HTTPS://WWW.DisneyPlus.com/pt-br/home?ref=menu#top "),
    "www.disneyplus.com"
  );
  assert.equal(normalizeHost("disneyplus.com/pt-br"), "disneyplus.com");
});

test("rejeita valores vazios, URLs inválidas e protocolos internos", () => {
  assert.throws(() => normalizeHost(""), /EMPTY_URL/);
  assert.throws(() => normalizeHost("não é um domínio"), /INVALID_URL/);
  assert.throws(() => normalizeHost("chrome://settings"), /UNSUPPORTED_PROTOCOL/);
});

test("gera padrões para o host e seus subdomínios", () => {
  assert.deepEqual(patternsForHost("disneyplus.com"), [
    "http://disneyplus.com/*",
    "https://disneyplus.com/*",
    "http://*.disneyplus.com/*",
    "https://*.disneyplus.com/*"
  ]);
  assert.deepEqual(patternsForHost("localhost"), [
    "http://localhost/*",
    "https://localhost/*"
  ]);
});

test("reconhece host exato e subdomínio sem confundir sufixos", () => {
  assert.equal(hostMatches("disneyplus.com", "disneyplus.com"), true);
  assert.equal(hostMatches("www.disneyplus.com", "disneyplus.com"), true);
  assert.equal(hostMatches("fakedisneyplus.com", "disneyplus.com"), false);
});

test("adiciona, rejeita duplicata e remove domínios", () => {
  const hosts = addAllowedHost([], "disneyplus.com/watch/123");
  assert.deepEqual(hosts, ["disneyplus.com"]);
  assert.throws(() => addAllowedHost(hosts, "https://disneyplus.com"), /DUPLICATE_HOST/);
  assert.deepEqual(removeAllowedHost(hosts, "disneyplus.com"), []);
});

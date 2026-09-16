# Ocultar Cursor em Tela Cheia

![Logo do Ocultar Cursor](assets/logo-ocultar-cursor.png)

**Assista sem o ponteiro atrapalhando a cena.** O Ocultar Cursor em Tela Cheia é uma extensão para Chrome, Edge e Firefox que esconde o cursor automaticamente após **4 segundos sem movimento** em players de vídeo em tela cheia. Mova o mouse e ele reaparece na hora.

Sem cadastro, sem configuração complicada e sem agir em sites que você não escolheu.

## Por que usar?

- **Mais imersão:** o ponteiro sai de cena quando você para de interagir.
- **Controle imediato:** ao mover o mouse, o cursor volta e a contagem recomeça.
- **Você escolhe onde funciona:** adicione ou remova domínios pelo ícone da extensão; a autorização inclui subdomínios.
- **Privacidade por padrão:** a lista de sites fica no armazenamento local do navegador. Não há conta, servidor, telemetria ou chamadas de rede da extensão.
- **Compatibilidade:** pacotes separados para navegadores Chromium (Chrome e Edge) e Firefox.

## Como funciona

1. Abra o site em que quer usar a extensão.
2. Clique no ícone do **Ocultar Cursor em Tela Cheia** e selecione **Adicionar site atual**. Você também pode digitar outro domínio ou link.
3. Coloque o player em tela cheia. Após 4 segundos sem atividade do mouse, o cursor desaparece.

O cursor fica visível durante a espera, mesmo se o player tentar escondê-lo antes. Ao sair da tela cheia, a extensão restaura o comportamento normal. Ela atua apenas nos domínios autorizados e em tela cheia da página; não controla o ponteiro do sistema operacional.

## Instalação manual

É necessário **Node.js 20 ou superior** para preparar os pacotes a partir do código-fonte. Na raiz do projeto, execute:

```bash
npm run check
```

Esse comando roda os testes e gera `dist/chromium` e `dist/firefox`.

| Navegador | Instalação |
| --- | --- |
| Chrome | Abra `chrome://extensions`, ative **Modo do desenvolvedor**, clique em **Carregar sem compactação** e selecione `dist/chromium`. |
| Edge | Abra `edge://extensions`, ative **Modo de desenvolvedor**, clique em **Carregar sem pacote** e selecione `dist/chromium`. |
| Firefox | Abra `about:debugging#/runtime/this-firefox`, clique em **Carregar extensão temporária** e selecione `dist/firefox/manifest.json`. |

No Firefox, a instalação temporária é removida ao fechar o navegador. Uma distribuição permanente requer assinatura pela Mozilla. **A extensão não está sendo apresentada aqui como publicada nas lojas dos navegadores.**

## Permissões e privacidade

A extensão usa armazenamento local para guardar os domínios escolhidos. O acesso para ler e alterar páginas é solicitado para cada domínio adicionado e revogado quando ele é removido. As permissões opcionais de host contemplam HTTP e HTTPS para o domínio e seus subdomínios. O código não envia dados a um servidor.

## Desenvolvimento

```bash
npm test       # executa os testes
npm run build  # gera os pacotes em dist/
npm run check  # testa e gera os pacotes
```

O código-fonte está em `src/`, os testes em `test/` e o gerador dos pacotes em `scripts/build.mjs`. A pasta `dist/` é gerada localmente e não faz parte do repositório.

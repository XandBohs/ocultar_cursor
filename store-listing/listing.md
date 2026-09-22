# Store listing content

Use the matching language block when completing each browser store listing.

## Shared URLs and classification

- Homepage: https://github.com/XandBohs/ocultar_cursor
- Support: https://github.com/XandBohs/ocultar_cursor/issues
- Privacy policy: https://github.com/XandBohs/ocultar_cursor/blob/main/PRIVACY.md
- Suggested category: Accessibility or Productivity
- Pricing: Free
- Remote code: No
- Data collection or transmission: None

## English

### Name

Hide Cursor in Fullscreen

### Short description

Automatically hides the cursor after four seconds of inactivity in fullscreen video players on sites you authorize.

### Full description

Enjoy fullscreen videos without the mouse pointer covering the picture. Hide Cursor in Fullscreen automatically hides the cursor after four seconds without mouse, keyboard, or click activity, then restores it immediately when you interact again.

You stay in control of where the extension runs. Open the extension popup and authorize only the domain you want to use. Authorization also applies to that domain's subdomains and can be removed at any time from the same list.

The extension works only while a page is in fullscreen mode. It stores the authorized-domain list locally in your browser and does not use accounts, analytics, telemetry, advertising, remote code, or developer-controlled servers.

### Single purpose

Hide the mouse cursor after four seconds of inactivity while an authorized website is displaying a fullscreen video player, and restore it as soon as the user interacts again.

### Search terms

fullscreen cursor, hide cursor, video player, cinema mode, mouse pointer

## Português do Brasil

### Nome

Ocultar Cursor em Tela Cheia

### Descrição curta

Oculta automaticamente o cursor após quatro segundos de inatividade em players de tela cheia nos sites que você autorizar.

### Descrição completa

Assista a vídeos em tela cheia sem o ponteiro do mouse cobrindo a imagem. O Ocultar Cursor em Tela Cheia esconde automaticamente o cursor após quatro segundos sem movimentos, teclas ou cliques e o restaura imediatamente quando você volta a interagir.

Você controla exatamente onde a extensão funciona. Abra o popup da extensão e autorize somente o domínio desejado. A autorização também contempla os subdomínios e pode ser removida a qualquer momento pela mesma lista.

A extensão atua apenas enquanto a página está em tela cheia. A lista de domínios autorizados fica armazenada localmente no navegador. Não há conta, anúncios, telemetria, dados analíticos, código remoto nem comunicação com servidores controlados pelo desenvolvedor.

### Propósito único

Ocultar o cursor do mouse após quatro segundos de inatividade enquanto um site autorizado exibe um player de vídeo em tela cheia e restaurá-lo assim que o usuário voltar a interagir.

### Termos de pesquisa

cursor tela cheia, ocultar cursor, player de vídeo, modo cinema, ponteiro do mouse

## Permission justifications

### `activeTab`

Used only when the user opens the extension popup, so the extension can identify the current tab's domain and offer to authorize it. / Usada somente quando o usuário abre o popup, para identificar o domínio da aba atual e oferecer sua autorização.

### `scripting`

Registers and injects the packaged cursor controller on domains explicitly authorized by the user. / Registra e injeta o controlador de cursor incluído no pacote apenas nos domínios autorizados explicitamente pelo usuário.

### `storage`

Stores the authorized-domain list locally in the browser. / Armazena localmente no navegador a lista de domínios autorizados.

### Optional host permissions

Requested through a direct user action for the selected HTTP or HTTPS domain and its subdomains. They are required for the extension to change cursor visibility on that site and are revoked when the domain is removed. / Solicitadas por uma ação direta do usuário para o domínio HTTP ou HTTPS selecionado e seus subdomínios. São necessárias para alterar a visibilidade do cursor nesse site e são revogadas quando o domínio é removido.

## Reviewer test instructions

1. Open any HTTP or HTTPS page that provides page fullscreen, such as a video player.
2. Open the extension popup and select **Add current site**.
3. Accept the browser's permission request for that domain.
4. Put the page or video player in fullscreen.
5. Stop interacting for four seconds; the cursor disappears.
6. Move the mouse, press a key, or click; the cursor immediately reappears and the timer restarts.
7. Exit fullscreen; normal cursor behavior is restored.
8. Remove the domain from the popup; its optional host permission is revoked.

No account, credentials, subscription, or region-specific setup is required.

## Privacy declarations

- The extension does not collect or transmit user data.
- The authorized-domain list remains in local extension storage.
- The extension does not use analytics, telemetry, ads, affiliate tracking, or remote code.
- The extension makes no network requests to a developer-controlled service.

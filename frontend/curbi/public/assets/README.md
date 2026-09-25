# Assets de CURBI — dónde colocar cada imagen

Todo lo que se usa en las vistas sale de `public/assets/`. **No hay SVG embebidos en el HTML**: cada
icono y cada imagen se referencia con `<img src="/assets/...">`.

Los **iconos de UI** (`assets/icons/*.svg`) son SVGs reales de la librería **Lucide** (MIT): no
necesitas reemplazarlos. Las **marcas/imágenes** (logos de bancos, Google, Outlook, VISA, mascota,
etc.) siguen en `assets/images/` como PNG.

## `assets/icons/` — iconos de CURBI (UI)

| Archivo | Dónde se usa | Origen |
| --- | --- | --- |
| `curbi-logo.png` | Logo en la barra superior de Home, Wallet, Saves, Profile, Transactions | Marca |
| `curbi-mascot.png` | Mascota del panel izquierdo en Login y Register | Marca |
| `chat-attach.svg` | Botón de adjuntar imagen del chat (Login/Register) | Lucide *paperclip* |
| `chat-emoji.svg` | Botón de emoji del chat | Lucide *smile* |
| `chat-mic.svg` | Botón de micrófono del chat | Lucide *mic* |
| `chat-send.svg` | Botón de enviar del chat | Lucide *send* |
| `chevron-right.svg` | Flecha de expandir en cada tarjeta de banco (Home) | Lucide *chevron-right* |
| `wallet-title.svg` | Icono junto a "YOUR ACTIVE WALLETS" (Home) | Lucide *wallet* |
| `savings-star.svg` | Icono de "YOUR SAVINGS ON THIS CARD" (Home) | Lucide *star* |
| `savings-pig.svg` | Icono de "YOUR SAVINGS ON THIS CARD" (Profile) | Lucide *piggy-bank* |
| `verified.svg` | Palomita de cuenta verificada (Profile) | Lucide *badge-check* |
| `goal-plane.svg` | Meta "VIAJE A LA ANTIGUA" (Saves) | Lucide *plane* |
| `goal-lock.svg` | Meta "FONDOS DE EMERGENCIA" (Saves) | Lucide *lock* |
| `goal-screen.svg` | Meta "NINTENDO SWITCH 2" (Saves) | Lucide *gamepad* |
| `contactless.svg` | Icono NFC/contactless de la tarjeta (Wallet) | Lucide (contactless) |
| `quick-transfer.svg` | Acción rápida "Transfer" (Wallet) | Lucide *arrow-left-right* |
| `quick-request.svg` | Acción rápida "Request" (Wallet) | Lucide *arrow-down-to-line* |
| `quick-pay.svg` | Acción rápida "Pay bill" (Wallet) | Lucide *receipt* |
| `quick-add.svg` | Acción rápida "Add card" (Wallet) | Lucide *credit-card* |
| `icon-transaction.svg` | Icono por defecto de transacción (Transactions/Home) | Lucide *arrow-right-left* |
| `camera.svg` | Botón para cambiar la foto de perfil (Profile) | Lucide *camera* |

## `assets/images/` — imágenes de marca / pendientes

| Archivo | Dónde se usa | Tamaño sugerido |
| --- | --- | --- |
| `bank-bi.png` | Logo de Banco Industrial: tarjetas del Home y tarjeta del Wallet | 96×96 |
| `bank-banrural.png` | Logo de Banrural en las tarjetas del Home y del Wallet | 96×96 |
| `bank-bancafe.png` | Logo de Banco del Café en las tarjetas del Home y del Wallet | 96×96 |
| `google.png` | Botón "LOGIN WITH GOOGLE" (Login/Register) | 48×48 |
| `outlook.png` | Botón "LOGIN WITH OUTLOOK" (Login) | 48×48 |
| `visa.png` | Marca VISA de la tarjeta (Wallet) | 140×56 |
| `avatar.png` | Foto de perfil: barra superior, hero de Profile y photo grande | 168×168 |
| `tx-efootball.png` | Icono de los movimientos de eFootball (Home) | 96×96 |
| `tx-monoposto.png` | Icono de los movimientos de Monoposto (Home) | 96×96 |
| `card-chip.png` | Chip dorado de la tarjeta (Wallet) | 64×48 |
| `hero-illustration.png` | Reserva para ilustración hero si se necesita | 640×480 |

## Reglas

1. **Iconos de UI** → solo en `assets/icons/` y como `.svg` (Lucide).
2. **Fotos/logos de terceros o pendientes** → en `assets/images/`.
3. Nunca pegar SVG inline en los `.html`; siempre `<img src="/assets/...">`.
4. Formato: iconos = SVG; marcas/imágenes = PNG (o WebP). Mantener el **mismo nombre de archivo**.
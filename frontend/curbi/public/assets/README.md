# Assets de CURBI — dónde colocar cada imagen

Todo lo que se usa en las vistas sale de `public/assets/`. **No hay SVG embebidos en el HTML**: cada
icono y cada imagen se referencia con `<img src="/assets/...">`.

Mientras no tengas el archivo real, se muestra el **placeholder PNG** que ya está en la carpeta
(borde punteado + etiqueta). Solo reemplaza el archivo **con el mismo nombre** y no hay que tocar
más código.

## `assets/icons/` — iconos de CURBI (marca y UI propia)

| Archivo | Dónde se usa | Tamaño sugerido |
| --- | --- | --- |
| `curbi-logo.png` | Logo en la barra superior de Home, Wallet, Saves, Profile, Transactions | 64×64 |
| `curbi-mascot.png` | Mascota del panel izquierdo en Login y Register | 340×360 |
| `chat-attach.png` | Botón de adjuntar imagen del chat (Login/Register) | 32×32 |
| `chat-emoji.png` | Botón de emoji del chat | 32×32 |
| `chat-mic.png` | Botón de micrófono del chat | 32×32 |
| `chat-send.png` | Botón de enviar del chat | 32×32 |
| `chevron-right.png` | Flecha de expandir en cada tarjeta de banco (Home) | 24×24 |
| `wallet-title.png` | Icono junto a "YOUR ACTIVE WALLETS" (Home) | 32×32 |
| `savings-star.png` | Icono de "YOUR SAVINGS ON THIS CARD" (Home) | 28×28 |
| `savings-pig.png` | Icono de "YOUR SAVINGS ON THIS CARD" (Profile) | 32×32 |
| `verified.png` | Palomita de cuenta verificada (Profile) | 36×36 |
| `goal-plane.png` | Meta "VIAJE A LA ANTIGUA" (Saves) | 48×48 |
| `goal-lock.png` | Meta "FONDOS DE EMERGENCIA" (Saves) | 48×48 |
| `goal-screen.png` | Meta "NINTENDO SWITCH 2" (Saves) | 48×48 |
| `contactless.png` | Icono NFC/contactless de la tarjeta (Wallet) | 44×44 |
| `quick-transfer.png` | Acción rápida "Transfer" (Wallet) | 48×48 |
| `quick-request.png` | Acción rápida "Request" (Wallet) | 48×48 |
| `quick-pay.png` | Acción rápida "Pay bill" (Wallet) | 48×48 |
| `quick-add.png` | Acción rápida "Add card" (Wallet) | 48×48 |
| `icon-transaction.png` | Icono por defecto de transacción (Transactions/Home) | 32×32 |

## `assets/images/` — imágenes que aún no me pasaste

| Archivo | Dónde se usa | Tamaño sugerido |
| --- | --- | --- |
| `bank-bi.png` | Logo de Banco Industrial: tarjetas del Home y tarjeta de crédito del Wallet | 96×96 |
| `bank-banrural.png` | Logo de Banrural en las tarjetas del Home | 96×96 |
| `bank-bancafe.png` | Logo de Banco del Café en las tarjetas del Home | 96×96 |
| `google.png` | Botón "LOGIN WITH GOOGLE" (Login/Register) | 48×48 |
| `outlook.png` | Botón "LOGIN WITH OUTLOOK" (Login) | 48×48 |
| `visa.png` | Marca VISA de la tarjeta (Wallet) | 140×56 |
| `avatar.png` | Foto de perfil: barra superior, hero de Profile y photo grande | 168×168 |
| `tx-efootball.png` | Icono de los movimientos de eFootball (Home) | 96×96 |
| `tx-monoposto.png` | Icono de los movimientos de Monoposto (Home) | 96×96 |
| `card-chip.png` | Chip dorado de la tarjeta (Wallet) | 64×48 |
| `hero-illustration.png` | Reserva para ilustración hero si se necesita | 640×480 |

## Reglas

1. **Iconos de CURBI** → solo en `assets/icons/`.
2. **Fotos/logos de terceros o pendientes** → en `assets/images/`.
3. Nunca pegar SVG inline en los `.html`; siempre `<img src="/assets/...">`.
4. Formato recomendado: PNG (o WebP). Mantener el **mismo nombre de archivo** del placeholder.

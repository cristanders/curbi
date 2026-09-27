import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TransferResult } from './api.service';

export interface ReceiptContext {
  /** Nombre del titular de la tarjeta que envia. */
  titular?: string;
  /** Numero de cuenta de origen, para que el comprobante sea verificable. */
  numeroOrigen?: string;
  /** Banco emisor de la tarjeta de origen. */
  bancoOrigen?: string;
}

const quetzales = (monto: number): string =>
  `Q${Number(monto || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fechaLarga = (momento: Date): string =>
  momento.toLocaleString('es-GT', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

/** Escapa texto que va dentro del HTML: el concepto lo escribe el usuario. */
const escapar = (texto: unknown): string =>
  String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Genera el comprobante de una transferencia.
 *
 * Se arma como HTML autonomo, con sus estilos embebidos, en vez de PDF: asi el
 * archivo abre en cualquier navegador, se imprime o se guarda como PDF desde el
 * navegador sin depender de una libreria que hay que instalar.
 */
@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private readonly platformId = inject(PLATFORM_ID);

  /** Nombre del archivo, con el id del movimiento para no sobrescribir. */
  fileName(resultado: TransferResult): string {
    const id = resultado.transaction?.id_transaction ?? 'mov';
    return `curbi-comprobante-${id}.html`;
  }

  /** Documento listo para abrir o descargar. */
  buildHtml(resultado: TransferResult, contexto: ReceiptContext = {}): string {
    const momento = new Date();
    const destino = resultado.destination;
    const filas: [string, string][] = [
      ['Concepto', resultado.description || 'Transferencia'],
      ['Titular de la cuenta de origen', contexto.titular || '—'],
      ['Cuenta de origen', contexto.numeroOrigen || '—'],
      ['Banco de origen', contexto.bancoOrigen || '—'],
      ['Beneficiario', destino?.account_holder || '—'],
      ['Cuenta de destino', destino?.account_number || '—'],
      ['Saldo restante en tu cuenta', quetzales(resultado.balance)],
      ['Numero de movimiento', `#${resultado.transaction?.id_transaction ?? '—'}`],
    ];

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Comprobante de transferencia · CURBI</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 32px 16px;
    background: #f2f4f8;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #16202e;
  }
  .recibo {
    max-width: 560px;
    margin: 0 auto;
    background: #fff;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 18px 40px rgba(22, 32, 46, .12);
  }
  .recibo-cabecera {
    background: linear-gradient(135deg, #0f9b6c, #0b6e4f);
    color: #fff;
    padding: 26px 28px;
  }
  .marca { font-size: 13px; letter-spacing: 3px; opacity: .85; }
  .tipo { margin: 6px 0 0; font-size: 21px; font-weight: 600; }
  .monto {
    padding: 28px;
    text-align: center;
    border-bottom: 1px dashed #d7dde6;
  }
  .monto span { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #667; }
  .monto strong { display: block; margin-top: 6px; font-size: 34px; color: #0f9b6c; }
  .detalle { padding: 22px 28px 8px; }
  .fila {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 9px 0;
    border-bottom: 1px solid #eef1f5;
    font-size: 14px;
  }
  .fila:last-child { border-bottom: none; }
  .fila span { color: #667; }
  .fila strong { font-weight: 600; text-align: right; word-break: break-word; }
  .pie { padding: 16px 28px 26px; text-align: center; font-size: 11px; color: #8894a5; }
  .anotacion {
    margin: 0 28px 18px;
    padding: 12px 14px;
    background: #f7f9fc;
    border-radius: 10px;
    font-size: 12px;
    color: #5a6780;
  }
  @media print {
    body { background: #fff; padding: 0; }
    .recibo { box-shadow: none; border-radius: 0; max-width: 100%; }
  }
</style>
</head>
<body>
  <div class="recibo">
    <div class="recibo-cabecera">
      <p class="marca">CURBI</p>
      <p class="tipo">Comprobante de transferencia</p>
    </div>

    <div class="monto">
      <span>Monto transferido</span>
      <strong>${escapar(quetzales(resultado.amount))}</strong>
    </div>

    <div class="detalle">
      ${filas
        .map(
          ([etiqueta, valor]) =>
            `<div class="fila"><span>${escapar(etiqueta)}</span><strong>${escapar(valor)}</strong></div>`,
        )
        .join('\n      ')}
    </div>

    <p class="anotacion">
      Documento generado por CURBI el ${escapar(fechaLarga(momento))}. Conservalo como
      respaldo del movimiento.
    </p>

    <p class="pie">Este comprobante se genero al momento de la transferencia.</p>
  </div>
</body>
</html>`;
  }

  /**
   * Descarga el comprobante como archivo. No hace nada fuera del navegador: en
   * el servidor no hay DOM donde crear el enlace temporal.
   */
  descargarTransferencia(resultado: TransferResult, contexto: ReceiptContext = {}): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const html = this.buildHtml(resultado, contexto);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = this.fileName(resultado);
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    // Si no se revoca, el objeto queda retenido hasta recargar la pagina.
    URL.revokeObjectURL(url);
  }
}

import {
  BillPayment,
  BillPaymentResult,
  PayBillDto,
  ServiceProvider,
} from '../model/billPayment';
import { BillPaymentRepository } from '../repository/billPaymentRepository';
import { BusinessError } from '../model/errors';
import { money } from '../utils/money';

/**
 * Entidades a las que Curbi sabe pagar. Los codigos tienen que coincidir con los
 * de `service-catalog.ts` en el frontend: ese archivo elige el que viaja en el
 * request y este decide si es una entidad real.
 *
 * Vive en el servidor a proposito. Si el nombre de la entidad lo aceptara
 * cualquier texto, un cliente podría pagar "eegsa" pero guardar el comprobante
 * con otro nombre y la notificacion mostraria una entidad que nunca se cobró.
 */
export const SERVICE_PROVIDERS: ServiceProvider[] = [
  { code: 'eegsa', name: 'EEGSA' },
  { code: 'aguas', name: 'Aguas de Guatemala' },
  { code: 'tigo', name: 'Tigo' },
  { code: 'claro', name: 'Claro' },
  { code: 'movistar', name: 'Movistar' },
  { code: 'igss', name: 'IGSS' },
];

/**
 * Como se ve el numero impreso en la factura: medidor, numero de cliente o de
 * afiliacion. Todos llevan letras, digitos y guiones ("PE-1029384", "IGSS-11223344").
 */
const REFERENCIA_VALIDA = /^[A-Z0-9-]{4,20}$/;

/** Cuantos digitos tiene que traer la referencia como minimo. */
const REFERENCIA_MINIMA = 4;

export class BillPaymentService {
  private billRepository = new BillPaymentRepository();

  /**
   * Paga un servicio desde la cuenta del usuario. El descuento lo hace el
   * repositorio en una transaccion; aqui se validan las reglas que no dependen
   * de la base: monto, entidad y referencia.
   */
  async pagarFactura(dto: PayBillDto): Promise<BillPaymentResult> {
    const amount = money(Number(dto.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BusinessError('MONTO_INVALIDO', 'Ingresa un monto valido');
    }
    if (dto.id_user === undefined || Number.isNaN(Number(dto.id_user))) {
      throw new BusinessError('USUARIO_INVALIDO', 'El usuario no es valido', 401);
    }
    if (dto.id_financial === undefined || Number.isNaN(Number(dto.id_financial))) {
      throw new BusinessError('CUENTA_INVALIDA', 'La tarjeta de origen no es valida');
    }

    const entidad = this.buscarEntidad(dto.provider_code);
    if (!entidad) {
      throw new BusinessError(
        'ENTIDAD_INVALIDA',
        'Esa entidad no recibe pagos. Elige una de la lista.',
        400,
      );
    }

    const idUser = Number(dto.id_user);
    const reference = this.normalizarReferencia(dto.reference);
    if (!REFERENCIA_VALIDA.test(reference)) {
      throw new BusinessError(
        'REFERENCIA_INVALIDA',
        `El numero de la factura debe tener al menos ${REFERENCIA_MINIMA} caracteres, sin espacios.`,
        400,
      );
    }

    // Pagar dos veces la misma factura es el error mas caro de esta pantalla, asi
    // que se comprueba antes de tocar el saldo. El indice unico de la tabla es la
    // red de seguridad por si dos pagos llegan a la vez.
    if (await this.billRepository.existsPaid(idUser, entidad.code, reference)) {
      throw new BusinessError(
        'REFERENCIA_INVALIDA',
        `La factura ${reference} de ${entidad.name} ya fue pagada.`,
        409,
      );
    }

    try {
      return await this.billRepository.payFromAccount({
        idUser,
        idFinancial: Number(dto.id_financial),
        providerCode: entidad.code,
        providerName: entidad.name,
        amount,
        reference,
      });
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY') {
        throw new BusinessError(
          'REFERENCIA_INVALIDA',
          `La factura ${reference} de ${entidad.name} ya fue pagada.`,
          409,
        );
      }
      throw error;
    }
  }

  private buscarEntidad(code: unknown): ServiceProvider | null {
    const limpio = String(code ?? '').trim().toLowerCase();
    return SERVICE_PROVIDERS.find((p) => p.code === limpio) ?? null;
  }

  /**
   * La referencia se compara contra el indice unico, asi que "pe-1029384" y
   * "PE-1029384" tienen que terminar siendo la misma cadena o el mismo pago
   * pasaria dos veces.
   */
  private normalizarReferencia(raw: unknown): string {
    return String(raw ?? '').trim().toUpperCase().replace(/\s+/g, '');
  }
}

/** Pago de un servicio (luz, agua, telefonia, internet, salud). */
export interface BillPayment {
  id_payment: number;
  id_user: number;
  id_financial: number;
  provider_code: string;
  provider_name: string;
  reference: string;
  amount: number;
  paid_at: string;
}

/**
 * Lo que llega a POST /api/bills/pay. El frontend manda el codigo y el nombre de
 * la entidad, pero el nombre que queda registrado lo decide el servidor a partir
 * de su catalogo: si el texto viniera manipulado, la notificacion mostraria un
 * nombre de entidad que en realidad no se cobro.
 */
export interface PayBillDto {
  id_user: number;
  /** Cuenta de la que sale el dinero. */
  id_financial: number;
  provider_code: string;
  provider_name?: string;
  amount: number;
  reference: string;
}

/**
 * Resultado del pago: el comprobante y el saldo que quedo en la tarjeta. El
 * frontend los usa para refrescar el saldo y armar el mensaje de exito.
 */
export interface BillPaymentResult {
  amount: number;
  /** Nombre de la entidad tal como quedo en el catalogo del servidor. */
  provider_name: string;
  reference: string;
  balance: number;
  transaction: {
    id_transaction: number;
    amount: number;
    type_transacion: 'Gasto';
    description: string;
    id_user: number;
    id_category: number;
  };
}

/** Entidad a la que se le puede pagar, tal como la define el servidor. */
export interface ServiceProvider {
  code: string;
  name: string;
}

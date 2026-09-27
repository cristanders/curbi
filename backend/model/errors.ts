/**
 * Error de negocio: el request es valido pero la operacion no se puede hacer
 * (saldo insuficiente, meta completa, tarjeta ajena...). El controller lo
 * traduce a un codigo que el frontend ya conoce, para que la UI pueda ofrecer
 * la salida correcta en vez de mostrar un error generico.
 */
export class BusinessError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number = 400,
    readonly details: Record<string, number> = {},
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}

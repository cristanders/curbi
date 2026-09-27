import { Request, Response } from 'express';
import { FinancialAccountService } from '../service/financialService';
import { BusinessError } from '../model/errors';

/** Los ids viajan en params; Express los deja como string o string[]. */
const idDe = (raw: unknown): number => {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return Number(value);
};

export class FinancialAccountController {
  private accountService = new FinancialAccountService();

  /** Los errores de negocio viajan con su codigo para que la UI reaccione. */
  private responderError(res: Response, error: any, status = 400): Response {
    if (error instanceof BusinessError) {
      return res.status(error.status).json({
        error: error.message,
        code: error.code,
        details: error.details,
      });
    }
    return res.status(status).json({ error: error.message });
  }

  getAccountsByUser = async (req: Request, res: Response): Promise<any> => {
    try {
      const idUser = idDe(req.params.idUser);
      if (isNaN(idUser)) {
        return res.status(400).json({ error: 'El ID de usuario no es válido' });
      }
      const accounts = await this.accountService.obtenerCuentasPorUsuario(idUser);
      return res.status(200).json(accounts);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };

  createAccount = async (req: Request, res: Response): Promise<any> => {
    try {
      const newAccount = await this.accountService.crearCuenta(req.body);
      return res.status(201).json(newAccount);
    } catch (error: any) {
      return this.responderError(res, error);
    }
  };

  /** GET /api/accounts/:idFinancial/state */
  getAccountState = async (req: Request, res: Response): Promise<any> => {
    try {
      const idFinancial = idDe(req.params.idFinancial);
      if (isNaN(idFinancial)) {
        return res.status(400).json({ error: 'El ID de la tarjeta no es válido' });
      }
      const state = await this.accountService.estadoCuenta(idFinancial);
      return res.status(200).json(state);
    } catch (error: any) {
      return this.responderError(res, error);
    }
  };

  /** GET /api/bank-accounts: catalogo de destinos para transferir. */
  getBankAccounts = async (_req: Request, res: Response): Promise<any> => {
    try {
      return res.status(200).json(await this.accountService.obtenerCatalogoCuentas());
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };

  /** POST /api/transfers */
  createTransfer = async (req: Request, res: Response): Promise<any> => {
    try {
      const result = await this.accountService.transferir(req.body);
      return res.status(201).json(result);
    } catch (error: any) {
      return this.responderError(res, error);
    }
  };

  /** POST /api/credit-requests */
  createCreditRequest = async (req: Request, res: Response): Promise<any> => {
    try {
      const request = await this.accountService.solicitarCupo(req.body);
      return res.status(201).json(request);
    } catch (error: any) {
      return this.responderError(res, error);
    }
  };
}

import { Request, Response } from 'express';
import { FinancialAccountService } from '../service/financialService';

export class FinancialAccountController {
  private accountService = new FinancialAccountService();

  getAccountsByUser = async (req: Request, res: Response): Promise<any> => {
    try {
      const rawParam = req.params.idUser;
      const idUserString = Array.isArray(rawParam) ? rawParam[0] : rawParam;
      const idUser = Number(idUserString);
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
      return res.status(400).json({ error: error.message });
    }
  };
}
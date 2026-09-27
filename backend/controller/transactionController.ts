import { Request, Response } from 'express';
import { BusinessError } from '../model/errors';
import { TransactionService } from '../service/transactionService';

export class TransactionController {
  private transactionService = new TransactionService();

  getTransactionsByUser = async (req: Request, res: Response): Promise<any> => {
    try {
      const rawParam = req.params.idUser;
      const idUserString = Array.isArray(rawParam) ? rawParam[0] : rawParam;
      const idUser = Number(idUserString);
      if (isNaN(idUser)) {
        return res.status(400).json({ error: 'El ID de usuario no es válido' });
      }
      const transactions = await this.transactionService.obtenerTransaccionesPorUsuario(idUser);
      return res.status(200).json(transactions);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };

  /** POST /api/transactions: movimiento + saldo del servidor en una sola operacion. */
  createTransaction = async (req: Request, res: Response): Promise<any> => {
    try {
      const result = await this.transactionService.crearTransaccion(req.body);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof BusinessError) {
        return res.status(error.status).json({
          error: error.message,
          code: error.code,
          details: error.details,
        });
      }
      return res.status(500).json({ error: error.message });
    }
  };
}

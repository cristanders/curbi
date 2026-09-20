import { Request, Response } from 'express';
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

  createTransaction = async (req: Request, res: Response): Promise<any> => {
    try {
      const newTransaction = await this.transactionService.crearTransaccion(req.body);
      return res.status(201).json(newTransaction);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };
}
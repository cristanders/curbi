import { Request, Response } from 'express';
import { ExpenditureAttemptService } from '../service/expeditureService';

export class ExpenditureAttemptController {
  private attemptService = new ExpenditureAttemptService();

  getAttemptsByUser = async (req: Request, res: Response): Promise<any> => {
    try {
      const rawParam = req.params.idUser;
      const idUserString = Array.isArray(rawParam) ? rawParam[0] : rawParam;
      const idUser = Number(idUserString);
      if (isNaN(idUser)) {
        return res.status(400).json({ error: 'El ID de usuario no es válido' });
      }
      const attempts = await this.attemptService.obtenerIntentosPorUsuario(idUser);
      return res.status(200).json(attempts);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };

  createAttempt = async (req: Request, res: Response): Promise<any> => {
    try {
      const newAttempt = await this.attemptService.crearIntentoGasto(req.body);
      return res.status(201).json(newAttempt);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };
}
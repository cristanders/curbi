import { Request, Response } from 'express';
import { ExpenditureAttemptService } from '../service/expeditureService';
import { AttemptResult } from '../model/expediture';
import { BusinessError } from '../model/errors';

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

  /**
   * Un intento frenado NO es un error: es una respuesta valida con la decision del
   * freno. Por eso el 201 llega tambien cuando el gasto se frena, y el frontend
   * muestra el motivo. Un error de verdad (no hay saldo, monto invalido) si se
   * devuelve como error.
   */
  createAttempt = async (req: Request, res: Response): Promise<any> => {
    try {
      const result: AttemptResult = await this.attemptService.crearIntentoGasto(req.body);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof BusinessError) {
        return res.status(error.status).json({ error: error.message, code: error.code });
      }
      return res.status(400).json({ error: error.message });
    }
  };
}

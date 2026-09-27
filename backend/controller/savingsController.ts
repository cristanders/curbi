import { Request, Response } from 'express';
import { SavingsGoalService } from '../service/savingsService';
import { BusinessError } from '../model/errors';

export class SavingsGoalController {
  private goalService = new SavingsGoalService();

  getGoalsByUser = async (req: Request, res: Response): Promise<any> => {
    try {
      const rawParam = req.params.idUser;
      const idUserString = Array.isArray(rawParam) ? rawParam[0] : rawParam;
      const idUser = Number(idUserString);
      if (isNaN(idUser)) {
        return res.status(400).json({ error: 'El ID de usuario no es válido' });
      }
      const goals = await this.goalService.obtenerMetasPorUsuario(idUser);
      return res.status(200).json(goals);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };

  createGoal = async (req: Request, res: Response): Promise<any> => {
    try {
      const newGoal = await this.goalService.crearMeta(req.body);
      return res.status(201).json(newGoal);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  // POST /api/savings/:idSaving/contribute
  contribute = async (req: Request, res: Response): Promise<any> => {
    try {
      const rawParam = req.params.idSaving;
      const idSavingString = Array.isArray(rawParam) ? rawParam[0] : rawParam;
      const idSaving = Number(idSavingString);
      if (isNaN(idSaving)) {
        return res.status(400).json({ error: 'El ID de la meta no es válido' });
      }
      const contribution = await this.goalService.aportarAMeta(idSaving, req.body);
      return res.status(200).json(contribution);
    } catch (error: any) {
      // El codigo de negocio viaja en la respuesta para que el modal sepa si
      // fue saldo insuficiente, meta completa, etc. y ofrezca la salida correcta.
      if (error instanceof BusinessError) {
        return res.status(error.status).json({
          error: error.message,
          code: error.code,
          details: error.details,
        });
      }
      return res.status(400).json({ error: error.message });
    }
  };
}

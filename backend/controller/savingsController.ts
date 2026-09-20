import { Request, Response } from 'express';
import { SavingsGoalService } from '../service/savingsService';

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
}
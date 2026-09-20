import { Request, Response } from 'express';
import { BudgetService } from '../service/budgetService';

export class BudgetController {
  private budgetService = new BudgetService();

  getBudgetsByUser = async (req: Request, res: Response): Promise<any> => {
    try {
      const rawParam = req.params.idUser;
      const idUserString = Array.isArray(rawParam) ? rawParam[0] : rawParam;
      const idUser = Number(idUserString);
      if (isNaN(idUser)) {
        return res.status(400).json({ error: 'El ID de usuario no es válido' });
      }
      const budgets = await this.budgetService.obtenerPresupuestosPorUsuario(idUser);
      return res.status(200).json(budgets);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };

  createBudget = async (req: Request, res: Response): Promise<any> => {
    try {
      const newBudget = await this.budgetService.crearPresupuesto(req.body);
      return res.status(201).json(newBudget);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };
}
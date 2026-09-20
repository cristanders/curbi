import { Budget, CreateBudgetDto } from "../model/budget";
import { BudgetRepository } from "../repository/bugetRepository";


export class BudgetService {
  private budgetRepository = new BudgetRepository();

  async obtenerPresupuestosPorUsuario(idUser: number): Promise<Budget[]> {
    return await this.budgetRepository.findByUser(idUser);
  }

  async crearPresupuesto(budgetDto: CreateBudgetDto): Promise<Budget> {
    if (budgetDto.amount <= 0) {
      throw new Error('El monto del presupuesto debe ser mayor a 0');
    }
    return await this.budgetRepository.create(budgetDto);
  }
}
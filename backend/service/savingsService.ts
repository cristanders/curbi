import { CreateSavingsGoalDto, SavingsGoal } from "../model/savings";
import { SavingsGoalRepository } from "../repository/savingsRepository";

export class SavingsGoalService {
  private goalRepository = new SavingsGoalRepository();

  async obtenerMetasPorUsuario(idUser: number): Promise<SavingsGoal[]> {
    return await this.goalRepository.findByUser(idUser);
  }

  async crearMeta(goalDto: CreateSavingsGoalDto): Promise<SavingsGoal> {
    if (goalDto.target_amount <= 0) {
      throw new Error('La meta de ahorro debe ser mayor a 0');
    }
    return await this.goalRepository.create(goalDto);
  }
}
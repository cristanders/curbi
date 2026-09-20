import { CreateExpenditureAttemptDto, ExpenditureAttempt } from "../model/expediture";
import { ExpenditureAttemptRepository } from "../repository/expeditureRepository";


export class ExpenditureAttemptService {
  private attemptRepository = new ExpenditureAttemptRepository();

  async obtenerIntentosPorUsuario(idUser: number): Promise<ExpenditureAttempt[]> {
    return await this.attemptRepository.findByUser(idUser);
  }

  async crearIntentoGasto(attemptDto: CreateExpenditureAttemptDto): Promise<ExpenditureAttempt> {
    if (attemptDto.estimated_amount <= 0) {
      throw new Error('El monto estimado debe ser mayor a 0');
    }
    return await this.attemptRepository.create(attemptDto);
  }
}
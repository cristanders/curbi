import { CreateTransactionDto, Transaction } from "../model/transaction";
import { TransactionRepository } from "../repository/transactionRepository";

export class TransactionService {
  private transactionRepository = new TransactionRepository();

  async obtenerTransaccionesPorUsuario(idUser: number): Promise<Transaction[]> {
    return await this.transactionRepository.findByUser(idUser);
  }

  async crearTransaccion(transactionDto: CreateTransactionDto): Promise<Transaction> {
    if (transactionDto.amount <= 0) {
      throw new Error('El monto de la transacción debe ser mayor a 0');
    }
    return await this.transactionRepository.create(transactionDto);
  }
}
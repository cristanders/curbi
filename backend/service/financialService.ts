import { CreateFinancialAccountDto, FinancialAccount } from "../model/financial";
import { FinancialAccountRepository } from "../repository/FinancialRepository";

export class FinancialAccountService {
  private accountRepository = new FinancialAccountRepository();

  async obtenerCuentasPorUsuario(idUser: number): Promise<FinancialAccount[]> {
    return await this.accountRepository.findByUser(idUser);
  }

  async crearCuenta(accountDto: CreateFinancialAccountDto): Promise<FinancialAccount> {
    return await this.accountRepository.create(accountDto);
  }
}
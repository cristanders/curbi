import { db } from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { CreateFinancialAccountDto, FinancialAccount } from '../model/financial';

export class FinancialAccountRepository {
  async findByUser(idUser: number): Promise<FinancialAccount[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM Financial_account WHERE id_user = ?',
      [idUser]
    );
    return rows as FinancialAccount[];
  }

  async create(accountDto: CreateFinancialAccountDto): Promise<FinancialAccount> {
    const { account_name, balance, id_user } = accountDto;
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO Financial_account (account_name, balance, id_user) VALUES (?, ?, ?)',
      [account_name, balance ?? 0.00, id_user || null]
    );

    return {
      id_financial: result.insertId,
      ...accountDto,
    };
  }
}
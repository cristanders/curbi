import { db } from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Budget, CreateBudgetDto } from '../model/budget';

export class BudgetRepository {
  async findByUser(idUser: number): Promise<Budget[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM Budget WHERE id_user = ?',
      [idUser]
    );
    return rows as Budget[];
  }

  async create(budgetDto: CreateBudgetDto): Promise<Budget> {
    const { amount, id_user } = budgetDto;
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO Budget (amount, id_user) VALUES (?, ?)',
      [amount, id_user]
    );

    return {
      id_budget: result.insertId,
      ...budgetDto,
    };
  }
}
import { db } from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { CreateSavingsGoalDto, SavingsGoal } from '../model/savings';

export class SavingsGoalRepository {
  async findByUser(idUser: number): Promise<SavingsGoal[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM Savings_goal WHERE id_user = ?',
      [idUser]
    );
    return rows as SavingsGoal[];
  }

  async create(goalDto: CreateSavingsGoalDto): Promise<SavingsGoal> {
    const { goal_name, target_amount, current_amount, id_user } = goalDto;
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO Savings_goal (goal_name, target_amount, current_amount, id_user) VALUES (?, ?, ?, ?)',
      [goal_name || null, target_amount, current_amount ?? 0.00, id_user]
    );

    return {
      id_saving: result.insertId,
      ...goalDto,
    };
  }
}
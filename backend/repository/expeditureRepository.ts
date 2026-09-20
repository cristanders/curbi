import { db } from '../config/database';

import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { CreateExpenditureAttemptDto, ExpenditureAttempt } from '../model/expediture';

export class ExpenditureAttemptRepository {
  async findByUser(idUser: number): Promise<ExpenditureAttempt[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM Expenditure_attempt WHERE id_user = ?',
      [idUser]
    );
    return rows as ExpenditureAttempt[];
  }

  async create(attemptDto: CreateExpenditureAttemptDto): Promise<ExpenditureAttempt> {
    const { product_name, estimated_amount, status, id_user } = attemptDto;
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO Expenditure_attempt (product_name, estimated_amount, status, id_user) VALUES (?, ?, ?, ?)',
      [product_name || null, estimated_amount, status || 'Pendiente', id_user]
    );

    return {
      id_expediture: result.insertId,
      ...attemptDto,
    };
  }
}
import { db } from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { CreateTransactionDto, Transaction } from '../model/transaction';

export class TransactionRepository {
  async findByUser(idUser: number): Promise<Transaction[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM Transaction WHERE id_user = ?',
      [idUser]
    );
    return rows as Transaction[];
  }

  async create(transactionDto: CreateTransactionDto): Promise<Transaction> {
    const { amount, type_transacion, description, id_user, id_category } = transactionDto;
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO Transaction (amount, type_transacion, description, id_user, id_category) VALUES (?, ?, ?, ?, ?)',
      [amount, type_transacion || null, description || null, id_user, id_category]
    );

    return {
      id_transaction: result.insertId,
      ...transactionDto,
    };
  }
}
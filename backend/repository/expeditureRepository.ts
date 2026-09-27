import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../config/database';
import {
  AttemptResult,
  AttemptStatus,
  CreateExpenditureAttemptDto,
  ExpenditureAttempt,
} from '../model/expediture';
import { money } from '../utils/money';

interface AttemptRow extends RowDataPacket {
  id_expediture: number;
  product_name: string | null;
  estimated_amount: number;
  status: AttemptStatus | null;
  id_user: number;
  id_category: number | null;
  id_transaction: number | null;
  reason: string | null;
  created_at: Date;
}

export class ExpenditureAttemptRepository {
  async findByUser(idUser: number, limit = 50): Promise<ExpenditureAttempt[]> {
    const [rows] = await db.query<AttemptRow[]>(
      `SELECT * FROM Expenditure_attempt
        WHERE id_user = ?
        ORDER BY created_at DESC, id_expediture DESC
        LIMIT ?`,
      [idUser, limit],
    );
    return rows.map((r) => this.toAttempt(r));
  }

  async create(
    dto: CreateExpenditureAttemptDto,
    decision: { status: AttemptStatus; reason: string | null; idTransaction: number | null },
  ): Promise<ExpenditureAttempt> {
    const { product_name, estimated_amount, id_user, id_category } = dto;
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO Expenditure_attempt
         (product_name, estimated_amount, status, id_user, id_category, id_transaction, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        product_name || null,
        estimated_amount,
        decision.status,
        id_user,
        id_category,
        decision.idTransaction,
        decision.reason,
      ],
    );

    return {
      id_expediture: result.insertId,
      product_name: product_name ?? undefined,
      estimated_amount: money(Number(estimated_amount)),
      status: decision.status,
      id_user,
      id_category,
      id_transaction: decision.idTransaction,
      reason: decision.reason,
      created_at: new Date().toISOString(),
    };
  }

  toResult(attempt: ExpenditureAttempt, balance: number | null): AttemptResult {
    return {
      attempt,
      status: attempt.status ?? 'Pendiente',
      reason: attempt.reason ?? null,
      balance,
      transaction: attempt.id_transaction ? { id_transaction: attempt.id_transaction } : null,
    };
  }

  private toAttempt(r: AttemptRow): ExpenditureAttempt {
    return {
      id_expediture: r.id_expediture,
      product_name: r.product_name ?? undefined,
      estimated_amount: money(Number(r.estimated_amount)),
      status: r.status ?? 'Pendiente',
      id_user: r.id_user,
      id_category: r.id_category ?? undefined,
      id_transaction: r.id_transaction,
      reason: r.reason,
      created_at: new Date(r.created_at).toISOString(),
    };
  }
}

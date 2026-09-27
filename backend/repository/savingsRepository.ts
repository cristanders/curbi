import { db } from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { CreateSavingsGoalDto, SavingsContribution, SavingsGoal } from '../model/savings';
import { FinancialAccount } from '../model/financial';
import { BusinessError } from '../model/errors';
import { money } from '../utils/money';

export class SavingsGoalRepository {
  async findByUser(idUser: number): Promise<SavingsGoal[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM Savings_goal WHERE id_user = ?',
      [idUser]
    );
    return rows as SavingsGoal[];
  }

  async findById(idSaving: number): Promise<SavingsGoal | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM Savings_goal WHERE id_saving = ?',
      [idSaving]
    );
    return (rows as SavingsGoal[])[0] ?? null;
  }

  /**
   * Suma el aporte sobre el saldo actual. El `SET current_amount = current_amount + ?`
   * lo resuelve la base para que dos aportes simultaneos no se pisen entre si.
   */
  async addContribution(idSaving: number, amount: number): Promise<SavingsGoal | null> {
    const [result] = await db.query<ResultSetHeader>(
      'UPDATE Savings_goal SET current_amount = COALESCE(current_amount, 0) + ? WHERE id_saving = ?',
      [amount, idSaving]
    );
    if (result.affectedRows === 0) {
      return null;
    }
    return await this.findById(idSaving);
  }

  /**
   * Aporte financiado desde la tarjeta: descuenta el saldo de la cuenta y suma
   * la meta en una sola transaccion.
   *
   * Las validaciones viven adentro de la transaccion a proposito. La meta y la
   * cuenta se bloquean con FOR UPDATE antes de mirar saldos, asi dos aportes
   * simultaneos sobre la misma tarjeta no pueden validar los dos contra el
   * mismo saldo y dejar la cuenta en negativo. Si algo falla, el rollback
   * deshace el descuento: nunca queda plata salida sin meta actualizada.
   */
  async contributeFromAccount(params: {
    idSaving: number;
    idUser: number;
    idFinancial: number;
    amount: number;
  }): Promise<SavingsContribution> {
    const { idSaving, idUser, idFinancial, amount } = params;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [goalRows] = await conn.query<RowDataPacket[]>(
        'SELECT * FROM Savings_goal WHERE id_saving = ? FOR UPDATE',
        [idSaving]
      );
      const goal = (goalRows as SavingsGoal[])[0] ?? null;
      if (!goal) {
        throw new BusinessError('META_INEXISTENTE', 'La meta de ahorro no existe', 404);
      }
      if (Number(goal.id_user) !== Number(idUser)) {
        throw new BusinessError('USUARIO_INVALIDO', 'La meta de ahorro pertenece a otro usuario', 403);
      }

      const restante = money(Number(goal.target_amount ?? 0) - Number(goal.current_amount ?? 0));
      if (restante <= 0) {
        throw new BusinessError('META_COMPLETA', 'Esta meta ya esta completa', 409);
      }
      if (amount > restante) {
        throw new BusinessError(
          'MONTO_INVALIDO',
          `El aporte no puede pasar la meta. Faltan Q${restante.toFixed(2)}`,
          409,
          { restante }
        );
      }

      const [accRows] = await conn.query<RowDataPacket[]>(
        'SELECT * FROM Financial_account WHERE id_financial = ? FOR UPDATE',
        [idFinancial]
      );
      const account = (accRows as FinancialAccount[])[0] ?? null;
      if (!account) {
        throw new BusinessError('CUENTA_INVALIDA', 'La tarjeta no existe', 404);
      }
      if (account.id_user != null && Number(account.id_user) !== Number(idUser)) {
        throw new BusinessError('CUENTA_INVALIDA', 'La tarjeta pertenece a otro usuario', 403);
      }

      const balance = money(Number(account.balance ?? 0));
      if (amount > balance) {
        throw new BusinessError(
          'SALDO_INSUFICIENTE',
          `Saldo insuficiente. Te faltan Q${money(amount - balance).toFixed(2)}.`,
          409,
          { disponible: balance, falta: money(amount - balance) }
        );
      }

      await conn.query('UPDATE Financial_account SET balance = ? WHERE id_financial = ?', [
        money(balance - amount),
        idFinancial,
      ]);
      await conn.query(
        'UPDATE Savings_goal SET current_amount = COALESCE(current_amount, 0) + ? WHERE id_saving = ?',
        [amount, idSaving]
      );

      // El dinero sale de la cuenta, asi que queda como gasto en el historial. La
      // categoria es obligatoria en la tabla: si la base no tiene ninguna, se
      // omite el movimiento en vez de tumbar el aporte completo.
      const [catRows] = await conn.query<RowDataPacket[]>(
        'SELECT id_category FROM category ORDER BY id_category LIMIT 1'
      );
      const idCategory = (catRows as RowDataPacket[])[0]?.id_category;
      if (idCategory != null) {
        await conn.query(
          'INSERT INTO `transaction` (amount, type_transacion, description, id_user, id_category) VALUES (?, ?, ?, ?, ?)',
          [amount, 'Gasto', `Aporte a meta: ${goal.goal_name ?? idSaving}`, idUser, idCategory]
        );
      }

      const [finalRows] = await conn.query<RowDataPacket[]>(
        'SELECT * FROM Savings_goal WHERE id_saving = ?',
        [idSaving]
      );
      await conn.commit();

      return {
        goal: {
          ...(finalRows as SavingsGoal[])[0],
          current_amount: money(Number(((finalRows as SavingsGoal[])[0] ?? {}).current_amount ?? 0)),
        },
        balance: money(balance - amount),
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async create(goalDto: CreateSavingsGoalDto): Promise<SavingsGoal> {
    const { goal_name, target_amount, current_amount, category, id_user } = goalDto;
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO Savings_goal (goal_name, target_amount, current_amount, category, id_user) VALUES (?, ?, ?, ?, ?)',
      [goal_name || null, target_amount, current_amount ?? 0.00, category || 'otro', id_user]
    );

    return {
      id_saving: result.insertId,
      ...goalDto,
    };
  }
}
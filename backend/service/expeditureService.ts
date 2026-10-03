import { AttemptResult, AttemptStatus, CreateExpenditureAttemptDto, ExpenditureAttempt } from '../model/expediture';
import { ExpenditureAttemptRepository } from '../repository/expeditureRepository';
import { BudgetRepository, currentPeriod } from '../repository/bugetRepository';
import { TransactionRepository } from '../repository/transactionRepository';
import { BusinessError } from '../model/errors';
import { money } from '../utils/money';

/**
 * El "freno" de compras.
 *
 * Pedir un gasto no es registrar un gasto: es pedir permiso. El backend decide
 * contra el limite de la categoria del mes en curso y solo registra el movimiento
 * si el intento cabe. Asi el presupuesto deja de ser un numero decorativo y pasa a
 * ser la regla que decide si la plata se mueve o no.
 */
export class ExpenditureAttemptService {
  private attemptRepository = new ExpenditureAttemptRepository();
  private budgetRepository = new BudgetRepository();
  private transactionRepository = new TransactionRepository();

  async obtenerIntentosPorUsuario(idUser: number): Promise<ExpenditureAttempt[]> {
    return await this.attemptRepository.findByUser(idUser);
  }

  /**
   * Evalua el intento y lo deja registrado con la decision.
   *
   * El movimiento se crea primero y el intento se inserta despues, al reves de lo
   * que parece. Si el INSERT del intento fallara despues de haber descontado, el
   * usuario tendria plata menos sin registro; en este orden lo que puede quedar
   * huerfano es un intento sin movimiento, que es un dato inofensivo.
   */
  async crearIntentoGasto(
    dto: CreateExpenditureAttemptDto & { id_financial?: number | null },
  ): Promise<AttemptResult> {
    const idUser = Number(dto.id_user);
    if (!Number.isFinite(idUser) || idUser <= 0) {
      throw new BusinessError('USUARIO_INVALIDO', 'El usuario no es valido', 401);
    }

    const monto = money(Number(dto.estimated_amount));
    if (!Number.isFinite(monto) || monto <= 0) {
      throw new BusinessError('MONTO_INVALIDO', 'El monto estimado debe ser mayor a 0');
    }
    if (monto > 10_000_000) {
      throw new BusinessError('MONTO_INVALIDO', 'El monto es demasiado alto');
    }

    const producto = this.validarProducto(dto.product_name);
    const idCategory = Number(dto.id_category ?? 1);
    if (!Number.isFinite(idCategory) || idCategory <= 0) {
      throw new BusinessError('CATEGORIA_INVALIDA', 'Elige una categoria');
    }

    const decision = await this.evaluar(idUser, idCategory, monto);
    if (decision.status === 'Frenado') {
      const attempt = await this.attemptRepository.create(
        { product_name: producto, estimated_amount: monto, id_user: idUser, id_category: idCategory },
        { status: decision.status, reason: decision.reason, idTransaction: null },
      );
      return this.attemptRepository.toResult(attempt, null);
    }

    // Sin cuenta no hay de donde restar: el intento queda aprobado como decision
    // pero no se toca ningun saldo, y el saldo en la respuesta va en null.
    const idFinancial = Number(dto.id_financial);
    let balance: number | null = null;
    let idTransaction: number | null = null;

    if (Number.isFinite(idFinancial) && idFinancial > 0) {
      const creado = await this.transactionRepository.create({
        amount: monto,
        type_transacion: 'Gasto',
        description: producto,
        id_user: idUser,
        id_financial: idFinancial,
        id_category: idCategory,
      });
      idTransaction = creado.transaction.id_transaction;
      balance = money(creado.balance);
    }

    const attempt = await this.attemptRepository.create(
      { product_name: producto, estimated_amount: monto, id_user: idUser, id_category: idCategory },
      { status: 'Aprobado', reason: decision.reason, idTransaction },
    );
    return this.attemptRepository.toResult(attempt, balance);
  }

  /**
   * Consulta el limite de la categoria para el mes en curso.
   *
   * Si la categoria no tiene limite, el intento se aprueba: no hay regla que
   * incumplir. Frenar algo sin presupuesto puesto seria una sorpresa, no una
   * proteccion.
   */
  private async evaluar(
    idUser: number,
    idCategory: number,
    monto: number,
  ): Promise<{ status: AttemptStatus; reason: string | null }> {
    const progreso = await this.budgetRepository.findProgressByUser(idUser, currentPeriod());
    const budget = progreso.find((b) => b.id_category === idCategory);

    if (!budget) {
      return { status: 'Aprobado', reason: null };
    }

    const total = money(budget.spent + monto);
    if (total > budget.amount) {
      return {
        status: 'Frenado',
        reason:
          `Te pasarias de tu limite de ${budget.category_name}: ` +
          `llevas ${budget.spent} y con esta compra serian ${total} de ${budget.amount}`,
      };
    }

    if (monto > budget.remaining) {
      // Cabe en el mes, pero no en lo que queda: avisarlo evita que el usuario
      // gaste lo que le queda de golpe sin saber cuanto le queda.
      return {
        status: 'Aprobado',
        reason: `Es tu ultimo gasto en ${budget.category_name} este mes: te quedan ${budget.remaining}`,
      };
    }

    return { status: 'Aprobado', reason: null };
  }

  private validarProducto(producto?: string): string {
    const limpio = (producto ?? '').trim();
    if (limpio.length === 0) {
      throw new BusinessError('PRODUCTO_INVALIDO', 'Escribe que quieres comprar');
    }
    if (limpio.length > 100) {
      throw new BusinessError('PRODUCTO_INVALIDO', 'El nombre es demasiado largo');
    }
    return limpio;
  }
}

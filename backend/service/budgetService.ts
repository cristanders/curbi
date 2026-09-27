import { BusinessError } from '../model/errors';
import { Budget, BudgetProgress } from '../model/budget';
import { BudgetRepository, currentPeriod } from '../repository/bugetRepository';
import { money } from '../utils/money';

const PERIODO_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export class BudgetService {
  private budgetRepository = new BudgetRepository();

  /**
   * Presupuestos del mes con lo gastado. El periodo se puede pedir con ?periodo=;
   * sin parametro va el mes en curso, que es lo que la pantalla muestra.
   */
  async obtenerPresupuestos(idUser: number, periodo?: string): Promise<BudgetProgress[]> {
    this.validarUsuario(idUser);
    return await this.budgetRepository.findProgressByUser(idUser, this.validarPeriodo(periodo));
  }

  /**
   * Crea o actualiza el limite de una categoria en un mes. Es un upsert a
   * proposito: volver a guardar Q500 en Comida debe cambiar el limite, no fallar
   * con un conflicto que el usuario no puede resolver.
   */
  async guardarPresupuesto(dto: {
    amount?: number;
    id_category?: number;
    period_month?: string;
    id_user?: number;
  }): Promise<Budget> {
    const idUser = Number(dto.id_user);
    this.validarUsuario(idUser);

    const idCategory = Number(dto.id_category);
    if (!Number.isFinite(idCategory) || idCategory <= 0) {
      throw new BusinessError('CATEGORIA_INVALIDA', 'Elige una categoria');
    }

    const amount = money(Number(dto.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BusinessError('MONTO_INVALIDO', 'El limite debe ser mayor a 0');
    }
    if (amount > 10_000_000) {
      throw new BusinessError('MONTO_INVALIDO', 'El limite es demasiado alto');
    }

    return await this.budgetRepository.upsert({
      amount,
      id_category: idCategory,
      period_month: this.validarPeriodo(dto.period_month),
      id_user: idUser,
    });
  }

  async eliminarPresupuesto(idBudget: number, idUser: number): Promise<void> {
    this.validarUsuario(idUser);
    const ok = await this.budgetRepository.remove(idBudget, idUser);
    if (!ok) {
      throw new BusinessError('PRESUPUESTO_INEXISTENTE', 'Ese limite no existe', 404);
    }
  }

  private validarUsuario(idUser: number): void {
    if (!Number.isFinite(idUser) || idUser <= 0) {
      throw new BusinessError('USUARIO_INVALIDO', 'El usuario no es valido', 401);
    }
  }

  /** Sin parametro, el mes en curso. Un periodo con formato raro se rechaza. */
  private validarPeriodo(periodo?: string): string {
    if (periodo === undefined || periodo === null || periodo === '') {
      return currentPeriod();
    }
    const valor = String(periodo).trim();
    if (!PERIODO_RE.test(valor)) {
      throw new BusinessError('PERIODO_INVALIDO', 'El periodo debe tener el formato YYYY-MM');
    }
    return valor;
  }
}

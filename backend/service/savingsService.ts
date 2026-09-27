import { ContributeSavingsDto, CreateSavingsGoalDto, SavingsCategory, SavingsContribution, SavingsGoal, DEFAULT_SAVINGS_CATEGORY, isSavingsCategory } from "../model/savings";
import { SavingsGoalRepository } from "../repository/savingsRepository";
import { BusinessError } from "../model/errors";
import { money } from "../utils/money";

export class SavingsGoalService {
  private goalRepository = new SavingsGoalRepository();

  async obtenerMetasPorUsuario(idUser: number): Promise<SavingsGoal[]> {
    return await this.goalRepository.findByUser(idUser);
  }

  /**
   * Crea una meta de ahorro.
   *
   * La categoria se valida contra el catalogo en vez de guardarse tal cual: es
   * la que decide el icono de la tarjeta, y si se aceptara cualquier texto una
   * meta con categoria "vaje" se quedaria sin icono y sin avisar. Si no viene
   * categoria se usa la generica, asi un cliente viejo que no manda el campo
   * sigue creando metas en vez de romper.
   */
  async crearMeta(goalDto: CreateSavingsGoalDto): Promise<SavingsGoal> {
    if (goalDto.target_amount <= 0) {
      throw new Error('La meta de ahorro debe ser mayor a 0');
    }

    let category: SavingsCategory = DEFAULT_SAVINGS_CATEGORY;
    if (goalDto.category !== undefined && goalDto.category !== null && goalDto.category !== '') {
      if (!isSavingsCategory(goalDto.category)) {
        throw new BusinessError('CATEGORIA_INVALIDA', 'Esa categoria de ahorro no existe', 400);
      }
      category = goalDto.category;
    }

    return await this.goalRepository.create({ ...goalDto, category });
  }

  /**
   * Aporta a una meta existente; el dinero sale de una tarjeta del usuario.
   *
   * El saldo lo descuenta el backend dentro de la misma transaccion que aumenta
   * la meta, asi que no hay forma de aportar sin tener el dinero: ni desde el
   * navegador ni llamando la API a mano. Devuelve ademas el saldo que quedo en
   * la tarjeta para que el wallet no tenga que recargarlo.
   */
  async aportarAMeta(idSaving: number, dto: ContributeSavingsDto): Promise<SavingsContribution> {
    const amount = money(Number(dto.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BusinessError('MONTO_INVALIDO', 'El aporte debe ser mayor a 0');
    }
    if (dto.id_user === undefined || Number.isNaN(Number(dto.id_user))) {
      throw new BusinessError('USUARIO_INVALIDO', 'El usuario no es valido', 401);
    }
    if (dto.id_financial === undefined || Number.isNaN(Number(dto.id_financial))) {
      throw new BusinessError(
        'CUENTA_INVALIDA',
        'Elige una tarjeta para aportar: el dinero sale de tu saldo.',
        400
      );
    }

    return await this.goalRepository.contributeFromAccount({
      idSaving,
      idUser: Number(dto.id_user),
      idFinancial: Number(dto.id_financial),
      amount,
    });
  }
}

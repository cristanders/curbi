import { BusinessError } from '../model/errors';
import {
  CreateTransactionDto,
  CreateTransactionResult,
  Transaction,
} from '../model/transaction';
import { TransactionRepository } from '../repository/transactionRepository';

const DESCRIPCION_MAX = 255;
const MONTO_MAX = 1_000_000;

export class TransactionService {
  private transactionRepository = new TransactionRepository();

  async obtenerTransaccionesPorUsuario(idUser: number): Promise<Transaction[]> {
    return await this.transactionRepository.findByUser(idUser);
  }

  async crearTransaccion(dto: CreateTransactionDto): Promise<CreateTransactionResult> {
    if (dto.type_transacion !== 'Ingreso' && dto.type_transacion !== 'Gasto') {
      throw new BusinessError('MOVIMIENTO_INVALIDO', 'El tipo debe ser Ingreso o Gasto');
    }
    if (!Number.isFinite(dto.id_user) || Number(dto.id_user) <= 0) {
      throw new BusinessError('USUARIO_INVALIDO', 'El usuario no es valido', 401);
    }
    if (!Number.isFinite(dto.id_category) || Number(dto.id_category) <= 0) {
      throw new BusinessError('CATEGORIA_INVALIDA', 'La categoria es obligatoria');
    }

    const monto = Number(dto.amount);
    if (!Number.isFinite(monto) || monto <= 0) {
      throw new BusinessError('MONTO_INVALIDO', 'El monto debe ser mayor a 0');
    }
    if (monto > MONTO_MAX) {
      throw new BusinessError('MONTO_INVALIDO', 'El monto es demasiado grande');
    }

    const descripcion = String(dto.description ?? '').trim();
    if (descripcion.length > DESCRIPCION_MAX) {
      throw new BusinessError('MOVIMIENTO_INVALIDO', 'La descripcion es muy larga');
    }

    return await this.transactionRepository.create({
      ...dto,
      amount: Math.round(monto * 100) / 100,
      description: descripcion || undefined,
    });
  }
}

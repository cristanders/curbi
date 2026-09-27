import { NotificationsPayload } from '../model/notification';
import { NotificationRepository } from '../repository/notificationRepository';
import { BusinessError } from '../model/errors';

/** Cuantos avisos se devuelven como maximo en una consulta. */
const LIMITE_NOTIFICACIONES = 30;

export class NotificationService {
  private notificationRepository = new NotificationRepository();

  /**
   * Avisos del usuario y cuantos quedan sin leer. Las dos cosas en una sola
   * respuesta: la pantalla pinta la lista y la campana pinta el badge, y asi no
   * hacen falta dos peticiones ni pueden desincronizarse.
   */
  async listar(idUser: number): Promise<NotificationsPayload> {
    if (Number.isNaN(Number(idUser))) {
      throw new BusinessError('USUARIO_INVALIDO', 'El usuario no es valido', 401);
    }
    const [notifications, unread] = await Promise.all([
      this.notificationRepository.findByUser(idUser, LIMITE_NOTIFICACIONES),
      this.notificationRepository.countUnread(idUser),
    ]);
    return { notifications, unread };
  }

  async marcarTodasLeidas(idUser: number): Promise<number> {
    if (Number.isNaN(Number(idUser))) {
      throw new BusinessError('USUARIO_INVALIDO', 'El usuario no es valido', 401);
    }
    return await this.notificationRepository.markAllRead(idUser);
  }
}

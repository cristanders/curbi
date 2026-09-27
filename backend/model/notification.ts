/**
 * Avisos del usuario. Los tipos son los que la pantalla de Notificaciones sabe
 * pintar; `Sistema` cubre los que no son un movimiento de dinero (bienvenida,
 * avisos de la banca).
 */
export type NotificationType = 'Transferencia' | 'Deposito' | 'Credito' | 'Factura' | 'Sistema';

export interface AppNotification {
  id_notification: number;
  id_user: number;
  type: NotificationType;
  title: string;
  message: string;
  /** Nullable: los avisos sin monto no lo traen. */
  amount?: number | null;
  is_read: boolean | 0 | 1;
  created_at: string;
}

/**
 * Lo que devuelve GET /api/notifications/user/:idUser. La lista y el numero de
 * pendientes viajan juntos para que un solo endpoint alimente tanto la pantalla
 * como el badge de la campana.
 */
export interface NotificationsPayload {
  notifications: AppNotification[];
  unread: number;
}

/** Aviso a registrar. Lo crean los flujos de dinero, no el usuario. */
export interface CreateNotificationDto {
  id_user: number;
  type: NotificationType;
  title: string;
  message: string;
  amount?: number | null;
}

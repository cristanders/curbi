import { Request, Response } from 'express';
import { NotificationService } from '../service/notificationService';
import { BusinessError } from '../model/errors';

export class NotificationController {
  private notificationService = new NotificationService();

  private responderError(res: Response, error: any, status = 400): Response {
    if (error instanceof BusinessError) {
      return res.status(error.status).json({
        error: error.message,
        code: error.code,
        details: error.details,
      });
    }
    return res.status(status).json({ error: error.message });
  }

  /** GET /api/notifications/user/:idUser: la lista y el numero de pendientes. */
  getNotifications = async (req: Request, res: Response): Promise<any> => {
    try {
      const rawParam = req.params.idUser;
      const idUser = Number(Array.isArray(rawParam) ? rawParam[0] : rawParam);
      if (isNaN(idUser)) {
        return res.status(400).json({ error: 'El ID de usuario no es válido' });
      }
      return res.status(200).json(await this.notificationService.listar(idUser));
    } catch (error: any) {
      return this.responderError(res, error, 500);
    }
  };

  /** POST /api/notifications/user/:idUser/read-all */
  markAllRead = async (req: Request, res: Response): Promise<any> => {
    try {
      const rawParam = req.params.idUser;
      const idUser = Number(Array.isArray(rawParam) ? rawParam[0] : rawParam);
      if (isNaN(idUser)) {
        return res.status(400).json({ error: 'El ID de usuario no es válido' });
      }
      const updated = await this.notificationService.marcarTodasLeidas(idUser);
      return res.status(200).json({ updated, unread: 0 });
    } catch (error: any) {
      return this.responderError(res, error);
    }
  };
}

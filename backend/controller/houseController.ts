import { Request, Response } from 'express';
import { HouseService } from '../service/houseService';
import { BusinessError } from '../model/errors';

export class HouseController {
  private houseService = new HouseService();

  /**
   * `username` es de quien se buscan los grupos (el propio para "mi familia", el de
   * otra persona para descubrir a quien unirse) y `viewerId` es quien pregunta,
   * porque el rol y la pertenencia dependen de el.
   */
  getHousesByUsername = async (req: Request, res: Response): Promise<any> => {
    try {
      const rawParam = req.params.username;
      const username = Array.isArray(rawParam) ? rawParam[0] : rawParam;
      if (!username) {
        return res.status(400).json({ error: 'El username no es válido' });
      }
      const viewerId = this.viewerId(req);
      const houses = await this.houseService.obtenerCasasPorUsuario(username, viewerId);
      return res.status(200).json(houses);
    } catch (error: any) {
      if (error instanceof BusinessError) {
        return res.status(error.status).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message });
    }
  };

  createHouse = async (req: Request, res: Response): Promise<any> => {
    try {
      const newHouse = await this.houseService.crearCasa(
        req.body?.name,
        this.username(req),
        this.viewerId(req),
      );
      return res.status(201).json(newHouse);
    } catch (error: any) {
      if (error instanceof BusinessError) {
        return res.status(error.status).json({ error: error.message, code: error.code });
      }
      return res.status(400).json({ error: error.message });
    }
  };

  joinHouse = async (req: Request, res: Response): Promise<any> => {
    try {
      const rawParam = req.params.idHouse;
      const idHouseString = Array.isArray(rawParam) ? rawParam[0] : rawParam;
      const idHouse = Number(idHouseString);
      if (isNaN(idHouse)) {
        return res.status(400).json({ error: 'El ID de grupo no es válido' });
      }
      const house = await this.houseService.unirseAGrupo(
        idHouse,
        this.viewerId(req),
        this.username(req),
      );
      return res.status(200).json(house);
    } catch (error: any) {
      if (error instanceof BusinessError) {
        return res.status(error.status).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * El username y el id viajan en el body (o en `?viewer=` en el GET, que no tiene
   * body) porque la API no tiene sesion: si el id se confiaria en la URL, cualquiera
   * podria unirse a un grupo usando el id de otro. El nombre lo manda el cliente,
   * asi que esto autentica por confianza, no por credencial.
   */
  private username(req: Request): string {
    const body = req.body ?? {};
    return String(body.username ?? '').trim();
  }

  private viewerId(req: Request): number {
    const body = req.body ?? {};
    const query = req.query.viewer;
    const desdeQuery = Array.isArray(query) ? query[0] : query;
    const id = Number(body.id_user ?? desdeQuery ?? req.params.viewerId);
    if (!Number.isFinite(id) || id <= 0) {
      throw new BusinessError('USUARIO_INVALIDO', 'El usuario no es valido', 401);
    }
    return id;
  }
}

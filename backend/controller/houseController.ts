import { Request, Response } from 'express';
import { HouseService } from '../service/houseService';

export class HouseController {
  private houseService = new HouseService();

  getHousesByUsername = async (req: Request, res: Response): Promise<any> => {
    try {
      const rawParam = req.params.username;
      const username = Array.isArray(rawParam) ? rawParam[0] : rawParam;
      if (!username) {
        return res.status(400).json({ error: 'El username no es válido' });
      }
      const houses = await this.houseService.obtenerCasasPorUsuario(username);
      return res.status(200).json(houses);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };

  createHouse = async (req: Request, res: Response): Promise<any> => {
    try {
      const newHouse = await this.houseService.crearCasa(req.body);
      return res.status(201).json(newHouse);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };
}
import { Request, Response } from 'express';
import { UserService } from '../service/userService';

export class UserController {
  private userService = new UserService();

  getUsers = async (req: Request, res: Response): Promise<any> => {
    try {
      const users = await this.userService.obtenerUsuarios();
      return res.status(200).json(users);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };

  createUser = async (req: Request, res: Response): Promise<any> => {
    try {
      const newUser = await this.userService.crearUsuario(req.body);
      return res.status(201).json(newUser);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };
}
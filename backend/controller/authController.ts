import { Request, Response } from 'express';
import { UserService } from '../service/userService';

export class AuthController {
  private userService = new UserService();

  // POST /api/auth/login  { identifier, password }
  // identifier puede ser email o username. Si no hay BD responde con un usuario demo
  // para que el frontend pueda continuar en modo demostracion.
  login = async (req: Request, res: Response): Promise<any> => {
    try {
      const { identifier, password } = req.body ?? {};
      if (!identifier || !password) {
        return res
          .status(400)
          .json({ error: 'Se requieren identifier (email o username) y password' });
      }

      let user: any = null;
      try {
        user = await this.userService.buscarParaLogin(String(identifier));
      } catch {
        user = null;
      }

      if (user && String(user.password) === String(password)) {
        const { password: _omit, ...safe } = user;
        return res.status(200).json({ user: safe, demo: false });
      }

      // Sin BD / sin coincidencia: modo demo para no bloquear la demo del proyecto
      return res.status(200).json({
        demo: true,
        user: {
          id_user: user?.id_user ?? 1,
          name: user?.name ?? 'BRAYAN CAMPA',
          username: user?.username ?? 'brayancampa',
          email: user?.email ?? identifier,
          phone: user?.phone ?? '+502 5555-1234',
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };

  // POST /api/auth/register  { name, username, email, phone, password }
  register = async (req: Request, res: Response): Promise<any> => {
    try {
      const { name, username, email, password, phone } = req.body ?? {};
      if (!name || !username || !email || !password) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }

      try {
        const created = await this.userService.crearUsuario({
          name,
          username,
          email,
          password,
          phone,
        } as any);
        const { password: _omit, ...safe } = created as any;
        return res.status(201).json({ user: safe, demo: false });
      } catch (dbError: any) {
        // BD no disponible: registra en modo demo
        return res.status(201).json({
          demo: true,
          user: { id_user: 1, name, username, email, phone },
          warning: dbError?.message,
        });
      }
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };
}

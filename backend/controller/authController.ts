import { Request, Response } from 'express';
import { UserService } from '../service/userService';
import { BusinessError } from '../model/errors';

import jwt from 'jsonwebtoken';

export class AuthController {
  private userService = new UserService();

  // GET /api/auth/google/callback
  googleCallback = (req: Request, res: Response): any => {
    try {
      const user = req.user as any;
      if (!user) {
        return res.redirect('http://localhost:4200/login?error=auth_failed');
      }
      const JWT_SECRET = process.env.JWT_SECRET || 'curbi_jwt_secret_key_2026';
      const token = jwt.sign(
        {
          id_user: user.id_user,
          name: user.name,
          username: user.username,
          email: user.email,
          phone: user.phone || '',
          avatar: user.avatar || '',
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.redirect(`http://localhost:4200/auth-success?token=${encodeURIComponent(token)}`);
    } catch {
      return res.redirect('http://localhost:4200/login?error=server_error');
    }
  };

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
      let dbFailed = false;
      try {
        user = await this.userService.buscarParaLogin(String(identifier));
      } catch {
        user = null;
        dbFailed = true;
      }

      if (user && String(user.password) === String(password)) {
        const { password: _omit, ...safe } = user;
        return res.status(200).json({ user: safe, demo: false });
      }

      if (dbFailed) {
        const namePart = String(identifier).includes('@') ? String(identifier).split('@')[0] : String(identifier);
        return res.status(200).json({
          demo: true,
          user: {
            id_user: 1,
            name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
            username: namePart,
            email: String(identifier).includes('@') ? String(identifier) : `${identifier}@curbi.app`,
            phone: '+502 5555-0101',
          },
          warning: 'Modo demostración (sin conexión a base de datos)',
        });
      }

      // Sin coincidencia: login inválido
      return res
        .status(401)
        .json({ error: 'Usuario o contraseña incorrectos. Revisa tus credenciales.' });
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
        // Solo un rechazo de negocio se responde como rechazo. Si el nombre de
        // usuario ya existe el frontend tiene que saberlo, no inventarle una
        // sesion: un id_user 1 falso dejaria al usuario viendo (y escribiendo en)
        // los datos de otra cuenta.
        if (dbError instanceof BusinessError) {
          return res
            .status(dbError.status)
            .json({ error: dbError.message, code: dbError.code, details: dbError.details });
        }
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

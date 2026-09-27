import { Request, Response } from 'express';
import { BusinessError } from '../model/errors';
import { UpdateProfileDto, User } from '../model/user';
import { UserService } from '../service/userService';

/** La contraseña nunca sale del backend por ningun endpoint. */
function sinPassword(user: User): Omit<User, 'password'> {
  const { password, ...safe } = user;
  void password;
  return safe;
}

export class UserController {
  private userService = new UserService();

  getUsers = async (req: Request, res: Response): Promise<any> => {
    try {
      const users = await this.userService.obtenerUsuarios();
      return res.status(200).json(users.map(sinPassword));
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };

  createUser = async (req: Request, res: Response): Promise<any> => {
    try {
      const newUser = await this.userService.crearUsuario(req.body);
      return res.status(201).json(sinPassword(newUser));
    } catch (error: any) {
      if (error instanceof BusinessError) {
        return res.status(error.status).json({ error: error.message, code: error.code });
      }
      return res.status(400).json({ error: error.message });
    }
  };

  // POST /api/users/:id/avatar  { avatar: "data:image/jpeg;base64,..." }
  updateAvatar = async (req: Request, res: Response): Promise<any> => {
    try {
      const idUser = Number(req.params.id);
      const { avatar } = req.body ?? {};
      if (!idUser || typeof avatar !== 'string' || avatar.length === 0) {
        return res.status(400).json({ error: 'Se requiere id de usuario y avatar' });
      }
      const updated = await this.userService.actualizarAvatar(idUser, avatar);
      if (!updated) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      return res.status(200).json({ user: sinPassword(updated) });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * PUT /api/users/:id  { name?, email?, phone?, location? }
   *
   * Solo los campos del perfil editable: username y password se ignoran aunque
   * vengan en el body, para que nadie se quede sin poder entrar a su cuenta.
   */
  updateProfile = async (req: Request, res: Response): Promise<any> => {
    try {
      const rawParam = req.params.id;
      const idUser = Number(Array.isArray(rawParam) ? rawParam[0] : rawParam);
      const body = (req.body ?? {}) as UpdateProfileDto;
      const dto: UpdateProfileDto = {};
      for (const campo of ['name', 'email', 'phone', 'location'] as const) {
        if (body[campo] !== undefined) {
          dto[campo] = body[campo] as string;
        }
      }
      const updated = await this.userService.actualizarPerfil(idUser, dto);
      return res.status(200).json({ user: sinPassword(updated) });
    } catch (error: any) {
      if (error instanceof BusinessError) {
        return res.status(error.status).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message });
    }
  };
}

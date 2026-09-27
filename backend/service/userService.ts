import { CreateUserDto, UpdateProfileDto, User } from '../model/user';
import { UserRepository } from '../repository/userRepository';
import { BusinessError } from '../model/errors';

export class UserService {
  private userRepository = new UserRepository();

  async obtenerUsuarios(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  // Busca por email o username para el login
  async buscarParaLogin(identifier: string): Promise<User | null> {
    const byUsername = await this.userRepository.findByUsername(identifier);
    if (byUsername) {
      return byUsername;
    }
    const byEmail = await this.userRepository.findByEmail(identifier);
    if (byEmail) {
      return byEmail;
    }
    const all = await this.userRepository.findAll();
    return all.find((u) => u.email === identifier || u.username === identifier) ?? null;
  }

  /**
   * El username repetido es un rechazo de negocio, no una falla de conexion.
   * Importa la distincion: authController solo cae en modo demo cuando la base no
   * responde, asi que antes un error plano aqui terminaba en una sesion fantasma
   * con id_user 1 en vez de avisar que el nombre ya existia.
   */
  async crearUsuario(userDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findByUsername(userDto.username);
    if (existingUser) {
      throw new BusinessError('USUARIO_INVALIDO', 'Ese nombre de usuario ya está registrado', 409);
    }

    return await this.userRepository.create(userDto);
  }

  // Actualiza la foto de perfil (data URL) de un usuario y devuelve el usuario actualizado
  async actualizarAvatar(idUser: number, avatar: string): Promise<User | null> {
    return await this.userRepository.updateAvatar(idUser, avatar);
  }

  /**
   * Perfil editable desde la pantalla de Perfil. Valida en vez de escribir lo que
   * venga: sin esto, un nombre vacio o un correo mal escrito se guardaban y
   * quedaban pegados hasta que el usuario corrigiera la pantalla.
   */
  async actualizarPerfil(idUser: number, body: UpdateProfileDto): Promise<User> {
    if (!Number.isFinite(Number(idUser)) || Number(idUser) <= 0) {
      throw new BusinessError('USUARIO_INVALIDO', 'El usuario no es valido', 401);
    }
    const actual = await this.userRepository.findById(Number(idUser));
    if (!actual) {
      throw new BusinessError('USUARIO_INVALIDO', 'Usuario no encontrado', 404);
    }

    const dto: UpdateProfileDto = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim().replace(/\s+/g, ' ');
      if (name.length < 3) {
        throw new BusinessError('PERFIL_INVALIDO', 'El nombre debe tener al menos 3 caracteres');
      }
      if (name.length > 60) {
        throw new BusinessError('PERFIL_INVALIDO', 'El nombre es demasiado largo');
      }
      dto.name = name;
    }

    if (body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase();
      // Deliberadamente simple: basta con un arroba y algo despues. Un parser
      // RFC completo rejects direcciones que si son validas en la practica.
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        throw new BusinessError('PERFIL_INVALIDO', 'El correo no tiene un formato valido');
      }
      const duplicate = await this.userRepository.findByEmail(email);
      if (duplicate && Number(duplicate.id_user) !== Number(idUser)) {
        throw new BusinessError('PERFIL_INVALIDO', 'Ese correo ya esta en uso', 409);
      }
      dto.email = email;
    }

    if (body.phone !== undefined) {
      const phone = String(body.phone).trim();
      if (phone.length > 30) {
        throw new BusinessError('PERFIL_INVALIDO', 'El telefono es demasiado largo');
      }
      // Se permiten espacios, guiones y parentesis; solo se rechazan letras.
      if (phone && !/^[\d\s()+.-]+$/.test(phone)) {
        throw new BusinessError('PERFIL_INVALIDO', 'El telefono solo admite numeros');
      }
      dto.phone = phone;
    }

    if (body.location !== undefined) {
      const location = String(body.location).trim();
      if (location.length > 80) {
        throw new BusinessError('PERFIL_INVALIDO', 'La ubicacion es demasiado larga');
      }
      dto.location = location;
    }

    if (Object.keys(dto).length === 0) {
      throw new BusinessError('PERFIL_INVALIDO', 'No hay cambios para guardar');
    }

    const updated = await this.userRepository.updateProfile(Number(idUser), dto);
    if (!updated) {
      throw new BusinessError('USUARIO_INVALIDO', 'Usuario no encontrado', 404);
    }
    return updated;
  }
}
import { CreateUserDto, User } from '../model/user';
import { UserRepository } from '../repository/userRepository';

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

  async crearUsuario(userDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findByUsername(userDto.username);
    if (existingUser) {
      throw new Error('El nombre de usuario ya está registrado');
    }

    return await this.userRepository.create(userDto);
  }
}
import { CreateUserDto, User } from '../model/user';
import { UserRepository } from '../repository/userRepository';

export class UserService {
  private userRepository = new UserRepository();

  async obtenerUsuarios(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async crearUsuario(userDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findByUsername(userDto.username);
    if (existingUser) {
      throw new Error('El nombre de usuario ya está registrado');
    }

    return await this.userRepository.create(userDto);
  }
}
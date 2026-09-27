import { CreateUserDto, UpdateProfileDto, User } from '../model/user';
import { db } from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export class UserRepository {
  async findAll(): Promise<User[]> {
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM Users');
    return rows as User[];
  }

  async findByUsername(username: string): Promise<User | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM Users WHERE username = ?',
      [username]
    );
    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM Users WHERE email = ?',
      [email]
    );
    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  }

  async findById(id: number): Promise<User | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM Users WHERE id_user = ?',
      [id]
    );
    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  }

  async updateAvatar(id: number, avatar: string): Promise<User | null> {
    await db.query('UPDATE Users SET avatar = ? WHERE id_user = ?', [avatar, id]);
    return await this.findById(id);
  }

  /**
   * Perfil editable. El SET se arma con los campos que llegaron en el body para
   * no pisar con NULL lo que el usuario no toco: si solo cambia el telefono, el
   * nombre y el correo tienen que seguir como estaban.
   */
  async updateProfile(id: number, dto: UpdateProfileDto): Promise<User | null> {
    const campos: string[] = [];
    const valores: unknown[] = [];
    for (const campo of ['name', 'email', 'phone', 'location'] as const) {
      if (dto[campo] !== undefined) {
        campos.push(`${campo} = ?`);
        valores.push(dto[campo] === '' ? null : dto[campo]);
      }
    }
    if (campos.length === 0) {
      return await this.findById(id);
    }

    valores.push(id);
    await db.query(`UPDATE Users SET ${campos.join(', ')} WHERE id_user = ?`, valores);
    return await this.findById(id);
  }

  async create(userDto: CreateUserDto): Promise<User> {
    const { name, username, email, phone, password } = userDto;
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO Users (name, username, email, phone, password) VALUES (?, ?, ?, ?, ?)',
      [name, username, email, phone || null, password]
    );

    return {
      id_user: result.insertId,
      ...userDto,
    };
  }
}
import { CreateUserDto, User } from '../model/user';
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
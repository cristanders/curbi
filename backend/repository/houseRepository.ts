import { db } from '../config/database';

import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { CreateHouseDto, House } from '../model/house';

export class HouseRepository {
  async findByUsername(username: string): Promise<House[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM House WHERE username = ?',
      [username]
    );
    return rows as House[];
  }

  async create(houseDto: CreateHouseDto): Promise<House> {
    const { name, username } = houseDto;
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO House (name, username) VALUES (?, ?)',
      [name, username]
    );

    return {
      id_house: result.insertId,
      ...houseDto,
    };
  }
}
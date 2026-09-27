import { db } from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Category, CreateCategoryDto } from '../model/category';

export class CategoryRepository {
  async findAll(): Promise<Category[]> {
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM Category');
    return rows as Category[];
  }

  async create(categoryDto: CreateCategoryDto): Promise<Category> {
    const { type_category } = categoryDto;
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO Category (type_category) VALUES (?)',
      [type_category]
    );

    return {
      id_category: result.insertId,
      ...categoryDto,
    };
  }
}
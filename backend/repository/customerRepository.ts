import { db } from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { CreateCustomerDto, Customer } from '../model/customer';

export class CustomerRepository {
  async findAll(): Promise<Customer[]> {
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM Customer');
    return rows as Customer[];
  }

  async findByUsername(username: string): Promise<Customer | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM Customer WHERE username = ?',
      [username]
    );
    const customers = rows as Customer[];
    return customers.length > 0 ? customers[0] : null;
  }

  async create(customerDto: CreateCustomerDto): Promise<Customer> {
    const { name, username, email, phone, password } = customerDto;
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO Customer (name, username, email, phone, password) VALUES (?, ?, ?, ?, ?)',
      [name, username, email, phone || null, password]
    );

    return {
      id_customer: result.insertId,
      ...customerDto,
    };
  }
}
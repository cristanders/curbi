export interface User {
  id_user: number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  password: string;
}

export type CreateUserDto = Omit<User, 'id_user'>;
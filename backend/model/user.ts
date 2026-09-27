export interface User {
  id_user: number;
  name: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  location?: string;
  avatar?: string;
}
export type CreateUserDto = Omit<User, 'id_user'>;

/**
 * Campos que la pantalla de Perfil deja editar. Deliberadamente NO incluye
 * `username` (es la identidad con la que se inicia sesion) ni `password` (tiene
 * su propio flujo): si el endpoint aceptara el body tal cual, cualquiera podria
 * cambiarse el username y perder la forma de entrar a su propia cuenta.
 */
export interface UpdateProfileDto {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
}
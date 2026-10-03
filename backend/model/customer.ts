export interface Customer {
  id_customer: number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  password: string;
}

export type CreateCustomerDto = Omit<Customer, 'id_customer'>;
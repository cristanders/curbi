import { CreateCustomerDto, Customer } from "../model/customer";
import { CustomerRepository } from "../repository/customerRepository";

export class CustomerService {
  private customerRepository = new CustomerRepository();

  async obtenerClientes(): Promise<Customer[]> {
    return await this.customerRepository.findAll();
  }

  async crearCliente(customerDto: CreateCustomerDto): Promise<Customer> {
    const existingCustomer = await this.customerRepository.findByUsername(customerDto.username);
    if (existingCustomer) {
      throw new Error('El nombre de usuario ya está registrado');
    }
    return await this.customerRepository.create(customerDto);
  }
}
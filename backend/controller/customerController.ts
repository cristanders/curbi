import { Request, Response } from 'express';
import { CustomerService } from '../service/customerService';

export class CustomerController {
  private customerService = new CustomerService();

  getCustomers = async (req: Request, res: Response): Promise<Response> => {
    try {
      const customers = await this.customerService.obtenerClientes();
      return res.status(200).json(customers);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };

  createCustomer = async (req: Request, res: Response): Promise<Response> => {
    try {
      const newCustomer = await this.customerService.crearCliente(req.body);
      return res.status(201).json(newCustomer);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };
}
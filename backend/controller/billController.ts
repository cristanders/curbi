import { Request, Response } from 'express';
import { BillPaymentService } from '../service/billPaymentService';
import { BusinessError } from '../model/errors';

export class BillController {
  private billService = new BillPaymentService();

  /** Los errores de negocio viajan con su codigo para que la UI reaccione. */
  private responderError(res: Response, error: any, status = 400): Response {
    if (error instanceof BusinessError) {
      return res.status(error.status).json({
        error: error.message,
        code: error.code,
        details: error.details,
      });
    }
    return res.status(status).json({ error: error.message });
  }

  /** POST /api/bills/pay */
  payBill = async (req: Request, res: Response): Promise<any> => {
    try {
      const result = await this.billService.pagarFactura(req.body);
      return res.status(201).json(result);
    } catch (error: any) {
      return this.responderError(res, error);
    }
  };
}

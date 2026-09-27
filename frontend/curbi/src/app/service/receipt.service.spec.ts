import { TestBed } from '@angular/core/testing';
import { ReceiptService } from './receipt.service';
import { TransferResult } from './api.service';

const TRANSFERENCIA: TransferResult = {
  amount: 25,
  balance: 75,
  description: 'Almuerzo del equipo',
  destination: {
    id_account: 2,
    account_number: '100200000002',
    account_holder: 'Ana Lopez',
    account_type: 'Credito',
    balance: 125,
    id_bank: 1,
    bank_name: 'Banco Industrial',
  },
  transaction: {
    id_transaction: 42,
    amount: 25,
    type_transacion: 'Gasto',
    description: 'Almuerzo del equipo',
    id_user: 1,
    id_category: 1,
  },
};

describe('ReceiptService', () => {
  let service: ReceiptService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReceiptService);
  });

  it('arma un documento con los datos de la transferencia', () => {
    const html = service.buildHtml(TRANSFERENCIA, {
      titular: 'Pablo Polanco',
      numeroOrigen: '100200000001',
      bancoOrigen: 'Banrural',
    });

    expect(html).toContain('Comprobante de transferencia');
    expect(html).toContain('Q25.00');
    expect(html).toContain('Almuerzo del equipo');
    expect(html).toContain('Ana Lopez');
    expect(html).toContain('100200000002');
    expect(html).toContain('Pablo Polanco');
    expect(html).toContain('100200000001');
    expect(html).toContain('#42');
  });

  it('incluye el saldo restante y el banco de origen', () => {
    const html = service.buildHtml(TRANSFERENCIA, {
      titular: 'Pablo Polanco',
      numeroOrigen: '100200000001',
      bancoOrigen: 'Banrural',
    });

    expect(html).toContain('Q75.00');
    expect(html).toContain('Banrural');
  });

  it('escapa el concepto para que un HTML malicioso no se ejecute', () => {
    const html = service.buildHtml(
      { ...TRANSFERENCIA, description: '<script>alert(1)</script>' },
      { titular: 'Pablo' },
    );

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('no rompe cuando el contexto viene vacio', () => {
    const html = service.buildHtml(TRANSFERENCIA);

    expect(html).toContain('Comprobante de transferencia');
    expect(html).toContain('Ana Lopez');
  });

  it('nombra el archivo con el id del movimiento', () => {
    expect(service.fileName(TRANSFERENCIA)).toBe('curbi-comprobante-42.html');
  });
});

/**
 * Entidades a las que se les puede pagar un servicio. Es un catalogo fijo del
 * cliente (igual que los bancos en bank-catalog.ts): el backend solo recibe el
 * codigo, el nombre y la referencia que viene impreso en la factura.
 */

export type ServiceCategory = 'Energia' | 'Agua' | 'Telefonia' | 'Internet' | 'Salud';

export interface ServiceProvider {
  /** Codigo estable que se manda al backend. */
  code: string;
  name: string;
  category: ServiceCategory;
  /** Como se llama el numero que viene impreso en la factura. */
  referenceLabel: string;
  placeholder: string;
  /** Abreviatura para la pastilla del selector. */
  glyph: string;
  color: string;
}

export const SERVICE_PROVIDERS: ServiceProvider[] = [
  {
    code: 'eegsa',
    name: 'EEGSA',
    category: 'Energia',
    referenceLabel: 'Número de medidor',
    placeholder: 'PE-1029384',
    glyph: 'EE',
    color: '#f59e0b',
  },
  {
    code: 'aguas',
    name: 'Aguas de Guatemala',
    category: 'Agua',
    referenceLabel: 'Número de medidor',
    placeholder: 'AG-556677',
    glyph: 'AG',
    color: '#0ea5e9',
  },
  {
    code: 'tigo',
    name: 'Tigo',
    category: 'Telefonia',
    referenceLabel: 'Número de cliente',
    placeholder: 'TG-9001122',
    glyph: 'TG',
    color: '#22c55e',
  },
  {
    code: 'claro',
    name: 'Claro',
    category: 'Internet',
    referenceLabel: 'Número de cliente',
    placeholder: 'CL-4430981',
    glyph: 'CL',
    color: '#ef4444',
  },
  {
    code: 'movistar',
    name: 'Movistar',
    category: 'Telefonia',
    referenceLabel: 'Número de cliente',
    placeholder: 'MV-7781200',
    glyph: 'MV',
    color: '#a855f7',
  },
  {
    code: 'igss',
    name: 'IGSS',
    category: 'Salud',
    referenceLabel: 'Número de afiliación',
    placeholder: 'IGSS-11223344',
    glyph: 'IG',
    color: '#6366f1',
  },
];

export function providerByCode(code: string): ServiceProvider | null {
  return SERVICE_PROVIDERS.find((p) => p.code === code) ?? null;
}

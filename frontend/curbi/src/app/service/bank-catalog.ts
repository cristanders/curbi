export type CardKind = 'Debito' | 'Credito';

export interface BankDef {
  id: string;
  name: string;
  monogram: string;
  /** Color de marca (fondo del monograma) */
  color: string;
  /** Degradado de la tarjeta */
  from: string;
  to: string;
  /** Logo oficial si existe en assets/images */
  logo?: string;
}

export const GUATEMALAN_BANKS: BankDef[] = [
  {
    id: 'bi',
    name: 'Banco Industrial',
    monogram: 'BI',
    color: '#0f2748',
    from: '#0f2748',
    to: '#14507a',
    logo: 'assets/images/bank-bi.png',
  },
  {
    id: 'banrural',
    name: 'Banco de Desarrollo Rural (Banrural)',
    monogram: 'BR',
    color: '#0b5d3b',
    from: '#0b5d3b',
    to: '#128a5b',
    logo: 'assets/images/bank-banrural.png',
  },
  {
    id: 'bancafe',
    name: 'Banco del Café (Bancafe)',
    monogram: 'BC',
    color: '#6e2b14',
    from: '#6e2b14',
    to: '#b3541e',
    logo: 'assets/images/bank-bancafe.png',
  },
  {
    id: 'bantrab',
    name: 'Banco de los Trabajadores (Bantrab)',
    monogram: 'BT',
    color: '#123f76',
    from: '#123f76',
    to: '#1c5ba6',
  },
  {
    id: 'bam',
    name: 'Banco Agromercantil (BAM)',
    monogram: 'BAM',
    color: '#0f6b5f',
    from: '#0f6b5f',
    to: '#1a9588',
  },
  {
    id: 'gt',
    name: 'Banco G&T Continental',
    monogram: 'G&T',
    color: '#1d3d6b',
    from: '#1d3d6b',
    to: '#2f6fb0',
  },
  {
    id: 'bac',
    name: 'Banco de América Central (BAC)',
    monogram: 'BAC',
    color: '#013a8a',
    from: '#013a8a',
    to: '#2b9bd1',
  },
  {
    id: 'promerica',
    name: 'Banco Promerica',
    monogram: 'PRO',
    color: '#a34017',
    from: '#a34017',
    to: '#d96a2a',
  },
  {
    id: 'azteca',
    name: 'Banco Azteca de Guatemala',
    monogram: 'AZ',
    color: '#0b418c',
    from: '#0b418c',
    to: '#1a6fd8',
  },
  {
    id: 'inmobiliario',
    name: 'Banco Inmobiliario',
    monogram: 'IN',
    color: '#14532d',
    from: '#14532d',
    to: '#1a8f4e',
  },
  {
    id: 'internacional',
    name: 'Banco Internacional',
    monogram: 'BI',
    color: '#003d7a',
    from: '#003d7a',
    to: '#0e5fa8',
  },
  {
    id: 'antigua',
    name: 'Banco de Antigua',
    monogram: 'BA',
    color: '#4a3050',
    from: '#4a3050',
    to: '#7a5ba0',
  },
];

export function bankById(id: string): BankDef {
  return GUATEMALAN_BANKS.find((b) => b.id === id) ?? GUATEMALAN_BANKS[0];
}
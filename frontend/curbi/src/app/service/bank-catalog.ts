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

/* ------------------------------------------------------------------ */
/* Red de la tarjeta (Visa / Mastercard / ...)                        */
/* ------------------------------------------------------------------ */

export type CardBrand = 'Visa' | 'Mastercard' | 'Amex' | 'Discover' | 'Desconocida';

/** Logos disponibles en assets/images. Las redes sin logo muestran solo la etiqueta. */
const CARD_NETWORK_LOGO: Partial<Record<CardBrand, string>> = {
  Visa: 'assets/images/visa.png',
  Mastercard: 'assets/images/mastercard.svg',
};

/** Etiqueta corta que se muestra bajo el logo de la tarjeta. */
const CARD_NETWORK_LABEL: Record<CardBrand, string> = {
  Visa: 'VISA',
  Mastercard: 'mastercard',
  Amex: 'AMERICAN EXPRESS',
  Discover: 'DISCOVER',
  Desconocida: 'TARJETA',
};

/** Quita todo lo que no sea digito (guiones, espacios, letras). */
export function digitsOnly(value: string): string {
  return (value ?? '').replace(/\D/g, '');
}

/**
 * Valida el numero con el algoritmo de Luhn. Devuelve `false` si esta vacio,
 * tiene menos de 13 digitos o el digito verificador no cuadra.
 */
export function luhnValid(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length < 13) {
    return false;
  }
  let sum = 0;
  let doubling = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);
    if (doubling) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    doubling = !doubling;
  }
  return sum % 10 === 0;
}

/**
 * Deduce la red a partir del IIN (los primeros digitos del numero):
 * 4 = Visa, 51-55 y 2221-2720 = Mastercard, 34/37 = Amex,
 * 6011/65/644-649 = Discover.
 */
export function detectCardBrand(value: string): CardBrand {
  const digits = digitsOnly(value);
  if (!luhnValid(digits)) {
    return 'Desconocida';
  }
  if (digits.startsWith('4')) {
    return 'Visa';
  }
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) {
    return 'Mastercard';
  }
  if (/^3[47]/.test(digits)) {
    return 'Amex';
  }
  if (/^6011/.test(digits) || /^65/.test(digits) || /^64[4-9]/.test(digits)) {
    return 'Discover';
  }
  return 'Desconocida';
}

/** URL del logo de la red, o cadena vacia si no tenemos el asset. */
export function cardNetworkLogo(brand: CardBrand): string {
  return CARD_NETWORK_LOGO[brand] ?? '';
}

/** Nombre de la red como se escribe en la tarjeta. */
export function cardNetworkLabel(brand: CardBrand): string {
  return CARD_NETWORK_LABEL[brand];
}

/** Agrupa el numero en bloques de 4 mientras se escribe. */
export function formatCardNumber(value: string): string {
  return digitsOnly(value).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** Normaliza la vigencia a MM/AA. */
export function formatCardExpiry(value: string): string {
  const digits = digitsOnly(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

/** Ultimos 4 digitos del numero, que es lo unico que se guarda. */
export function last4Of(value: string): string {
  return digitsOnly(value).slice(-4);
}
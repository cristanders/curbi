export interface SavingsGoal {
  id_saving: number;
  goal_name?: string;
  target_amount: number;
  current_amount?: number;
  /** Que se esta ahorrando (viaje, casa, emergencia...). Decide el icono. */
  category?: string;
  id_user: number;
}

/**
 * Catalogo de categorias de ahorro. Es la lista blanca: el service rechaza
 * cualquier categoria que no este aca, para que la base no se llene de
 * typos y el frontend no tenga que adivinar el icono de un valor desconocido.
 *
 * El orden es el que ve la persona en el selector de la pantalla de My saves.
 */
export const SAVINGS_CATEGORIES = [
  'viaje',
  'emergencia',
  'casa',
  'auto',
  'educacion',
  'salud',
  'boda',
  'negocio',
  'tecnologia',
  'gaming',
  'musica',
  'mascota',
  'regalo',
  'retiro',
  'otro',
] as const;

export type SavingsCategory = (typeof SAVINGS_CATEGORIES)[number];

/** La que se usa cuando no se dice ninguna: siempre tiene icono propio. */
export const DEFAULT_SAVINGS_CATEGORY: SavingsCategory = 'otro';

export const isSavingsCategory = (value: unknown): value is SavingsCategory =>
  typeof value === 'string' && (SAVINGS_CATEGORIES as readonly string[]).includes(value);

export type CreateSavingsGoalDto = Omit<SavingsGoal, 'id_saving'>;

/**
 * Aporte de dinero a una meta existente. El dinero sale de una cuenta del
 * usuario: sin `id_financial` el aporte no se acepta, porque una meta no puede
 * financiarse sola.
 */
export interface ContributeSavingsDto {
  amount: number;
  id_user: number;
  id_financial: number;
}

/** Resultado del aporte: la meta ya actualizada y el saldo que quedo en la tarjeta. */
export interface SavingsContribution {
  goal: SavingsGoal;
  balance: number;
}

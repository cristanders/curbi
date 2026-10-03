/**
 * Los montos se guardan en double(10,2). Sin redondear, sumar y restar saldos
 * deja decimales sucios (0.1 + 0.2 = 0.30000000000000004) que despues se ven
 * como Q99.999999 en la pantalla.
 */
export const money = (value: number): number => Math.round(value * 100) / 100;

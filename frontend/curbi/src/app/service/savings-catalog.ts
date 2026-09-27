/**
 * Catalogo de categorias de ahorro: que se puede ahorrar y que icono lo dibuja.
 *
 * Antes el icono salia de la POSICION de la meta en la lista (icons[i % 3]), con
 * tres iconos fijos: la primera recibia el avion, la segunda el candado y la
 * tercera la consola. Por eso una meta llamada "Viaje a Antigua" aparecia con el
 * icono de consola si era la tercera. Ahora el icono se deduce de la categoria
 * que elige la persona, asi que el nombre y el dibujo siempre coinciden.
 *
 * El backend tiene su propia lista blanca (SAVINGS_CATEGORIES en
 * model/savings.ts) y la valida: si aqui se agrega una categoria hay que
 * agregarla alla, o el POST vuelve con CATEGORIA_INVALIDA.
 */
export interface SavingsCategoryOption {
  /** Valor que viaja al backend y se guarda en Savings_goal.category. */
  id: string;
  label: string;
  icon: string;
  /** Palabras que sirven para adivinar la categoria desde el nombre escrito. */
  keywords: readonly string[];
}

export const SAVINGS_CATEGORIES: readonly SavingsCategoryOption[] = [
  { id: 'viaje', label: 'Viaje', icon: 'assets/icons/goal-plane.svg', keywords: ['viaje', 'viajar', 'volar', 'avion', 'turismo', 'pasaje', 'hotel'] },
  { id: 'emergencia', label: 'Emergencia', icon: 'assets/icons/goal-lock.svg', keywords: ['emergencia', 'reserva', 'imprevisto', 'seguridad', 'colchon'] },
  { id: 'casa', label: 'Casa', icon: 'assets/icons/goal-house.svg', keywords: ['casa', 'departamento', 'apartamento', 'lote', 'terreno', 'vivienda', 'alquiler', 'hipoteca', 'mortaja'] },
  { id: 'auto', label: 'Auto', icon: 'assets/icons/goal-car.svg', keywords: ['auto', 'carro', 'coche', 'vehiculo', 'moto', 'carreta'] },
  { id: 'educacion', label: 'Educacion', icon: 'assets/icons/goal-cap.svg', keywords: ['educacion', 'estudio', 'estudiar', 'universidad', 'colegio', 'maestria', 'doctorado', 'carrera', 'matricula', 'curso', 'libros'] },
  { id: 'salud', label: 'Salud', icon: 'assets/icons/goal-health.svg', keywords: ['salud', 'medico', 'medicina', 'dentista', 'operacion', 'cirugia', 'tratamiento', 'seguro'] },
  { id: 'boda', label: 'Boda', icon: 'assets/icons/goal-rings.svg', keywords: ['boda', 'casamiento', 'matrimonio', 'novios', 'luna de miel'] },
  { id: 'negocio', label: 'Negocio', icon: 'assets/icons/goal-briefcase.svg', keywords: ['negocio', 'empresa', 'tienda', 'local', 'startup', 'proyecto', 'independiente', 'freelance', 'inventario'] },
  { id: 'tecnologia', label: 'Tecnologia', icon: 'assets/icons/goal-screen.svg', keywords: ['tecnologia', 'computadora', 'laptop', 'celular', 'telefono', 'tablet', 'monitor', 'teclado', 'camara', 'smartphone', 'iphone', 'disco', 'memoria'] },
  { id: 'gaming', label: 'Gaming', icon: 'assets/icons/goal-gamepad.svg', keywords: ['gaming', 'consola', 'juego', 'juegos', 'playstation', 'xbox', 'nintendo', 'switch', 'videojuego', 'pc gamer'] },
  { id: 'musica', label: 'Musica', icon: 'assets/icons/goal-music.svg', keywords: ['musica', 'instrumento', 'guitarra', 'piano', 'violin', 'bateria', 'estudio de grabacion', 'sonido'] },
  { id: 'mascota', label: 'Mascota', icon: 'assets/icons/goal-paw.svg', keywords: ['mascota', 'perro', 'perrito', 'gato', 'gatito', 'cachorro', 'veterinario', 'adopcion'] },
  { id: 'regalo', label: 'Regalo', icon: 'assets/icons/goal-gift.svg', keywords: ['regalo', 'regalos', 'navidad', 'aniversario', 'cumpleanos', 'regalos'] },
  { id: 'retiro', label: 'Retiro', icon: 'assets/icons/goal-umbrella.svg', keywords: ['retiro', 'jubilacion', 'pension', 'vejez', 'independencia financiera'] },
  { id: 'otro', label: 'Otro', icon: 'assets/icons/goal-other.svg', keywords: [] },
];

/** La que se usa cuando no se reconoce ninguna: siempre tiene icono propio. */
export const DEFAULT_CATEGORY_ID = 'otro';

const BY_ID = new Map(SAVINGS_CATEGORIES.map((c) => [c.id, c]));

/**
 * Minúsculas y sin acentos, para que "Educación" y "educacion" se comparen
 * igual. `normalize('Á')` en un string normalizado a NFD queda como 'A'.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Categoria que corresponde a un valor guardado. Si el backend devuelve algo
 * fuera del catalogo (una meta vieja, otra version del API) se cae en 'otro' en
 * vez de dejar la tarjeta sin icono.
 */
export function categoryById(id: string | null | undefined): SavingsCategoryOption {
  return (id ? BY_ID.get(id) : undefined) ?? BY_ID.get(DEFAULT_CATEGORY_ID)!;
}

/**
 * Adivina la categoria a partir del nombre de la meta. Se usa para preelegir la
 * categoria mientras se escribe y para las metas que todavia no tienen
 * categoria guardada.
 */
export function matchCategory(name: string | null | undefined): string {
  const text = normalize(name ?? '');
  if (!text.trim()) {
    return DEFAULT_CATEGORY_ID;
  }
  for (const option of SAVINGS_CATEGORIES) {
    if (option.keywords.some((k) => text.includes(normalize(k)))) {
      return option.id;
    }
  }
  return DEFAULT_CATEGORY_ID;
}

/**
 * Icono de una meta. Primero manda la categoria guardada; si no hay, se deduce
 * del nombre. Nunca devuelve cadena vacia: la tarjeta siempre muestra algo.
 */
export function iconForGoal(category: string | null | undefined, name: string | null | undefined): string {
  const id = category && BY_ID.has(category) ? category : matchCategory(name);
  return categoryById(id).icon;
}

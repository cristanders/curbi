import {
  DEFAULT_CATEGORY_ID,
  SAVINGS_CATEGORIES,
  categoryById,
  iconForGoal,
  matchCategory,
} from './savings-catalog';

describe('savings-catalog', () => {
  it('expone las categorias que se ofrecen en el selector', () => {
    expect(SAVINGS_CATEGORIES.length).toBeGreaterThanOrEqual(12);
  });

  it('no repite ids y todas tienen icono', () => {
    const ids = SAVINGS_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const option of SAVINGS_CATEGORIES) {
      expect(option.icon).toMatch(/^assets\/icons\/goal-[a-z]+\.svg$/);
      expect(option.label.length).toBeGreaterThan(1);
    }
  });

  describe('iconForGoal', () => {
    it('usa el icono de la categoria guardada', () => {
      expect(iconForGoal('viaje', 'Viaje a Antigua')).toBe('assets/icons/goal-plane.svg');
      expect(iconForGoal('casa', 'Lo que sea')).toBe('assets/icons/goal-house.svg');
      expect(iconForGoal('gaming', 'Lo que sea')).toBe('assets/icons/goal-gamepad.svg');
    });

    // El bug que motivo el cambio: el icono se ciclaba por posicion y una meta de
    // viaje en tercera posicion salia con el icono de consola.
    it('no asigna el icono por posicion en la lista', () => {
      const metas = [
        { category: 'viaje', name: 'VIAJE' },
        { category: 'emergencia', name: 'EMERGENCIA' },
        { category: 'gaming', name: 'CONSOLA' },
        { category: 'viaje', name: 'OTRO VIAJE' },
      ].map((g) => iconForGoal(g.category, g.name));

      expect(metas[0]).toBe('assets/icons/goal-plane.svg');
      expect(metas[1]).toBe('assets/icons/goal-lock.svg');
      expect(metas[2]).toBe('assets/icons/goal-gamepad.svg');
      // La cuarta repite la primera: es la misma categoria, no un "tercer icono".
      expect(metas[3]).toBe('assets/icons/goal-plane.svg');
    });

    it('cae al icono de la categoria si la meta viene sin categoria', () => {
      expect(iconForGoal(null, 'Viaje a Antigua')).toBe('assets/icons/goal-plane.svg');
      expect(iconForGoal(undefined, 'COMPRA UNA MOTO')).toBe('assets/icons/goal-car.svg');
    });

    it('cae al generico si la categoria no existe o el nombre tampoco dice nada', () => {
      expect(iconForGoal('categoria-inventada', 'qqq')).toBe('assets/icons/goal-other.svg');
      expect(iconForGoal(null, 'qqq')).toBe('assets/icons/goal-other.svg');
      expect(iconForGoal(null, null)).toBe('assets/icons/goal-other.svg');
    });

    it('siempre devuelve un icono, nunca cadena vacia', () => {
      for (const option of SAVINGS_CATEGORIES) {
        expect(iconForGoal(option.id, 'lo que sea').length).toBeGreaterThan(0);
      }
    });
  });

  describe('matchCategory', () => {
    it('reconoce las palabras que la gente escribe', () => {
      expect(matchCategory('Viaje a Antigua')).toBe('viaje');
      expect(matchCategory('Fondo de emergencia')).toBe('emergencia');
      expect(matchCategory('Comprar laptop nueva')).toBe('tecnologia');
      expect(matchCategory('mi perrito')).toBe('mascota');
      expect(matchCategory('Regalos de navidad')).toBe('regalo');
    });

    it('ignora tildes y mayusculas', () => {
      expect(matchCategory(' EDUCACION ')).toBe('educacion');
      expect(matchCategory('Educación')).toBe('educacion');
      expect(matchCategory('Música')).toBe('musica');
      expect(matchCategory('JUBILACIÓN')).toBe('retiro');
    });

    it('devuelve la categoria generica cuando no reconoce nada', () => {
      expect(matchCategory('qqq')).toBe(DEFAULT_CATEGORY_ID);
      expect(matchCategory('')).toBe(DEFAULT_CATEGORY_ID);
      expect(matchCategory(null)).toBe(DEFAULT_CATEGORY_ID);
    });
  });

  it('categoryById cae en la generica para un id desconocido', () => {
    expect(categoryById('viaje').id).toBe('viaje');
    expect(categoryById('nope').id).toBe(DEFAULT_CATEGORY_ID);
    expect(categoryById(null).id).toBe(DEFAULT_CATEGORY_ID);
  });
});

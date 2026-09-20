export type CategoryType = 'Fijo' | 'Personal' | 'Ahorro';

export interface Category {
  id_category: number;
  type_category: CategoryType;
}

export type CreateCategoryDto = Omit<Category, 'id_category'>;
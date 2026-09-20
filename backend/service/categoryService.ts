import { Category, CreateCategoryDto } from "../model/category";
import { CategoryRepository } from "../repository/categoryRepository";


export class CategoryService {
  private categoryRepository = new CategoryRepository();

  async obtenerCategorias(): Promise<Category[]> {
    return await this.categoryRepository.findAll();
  }

  async crearCategoria(categoryDto: CreateCategoryDto): Promise<Category> {
    return await this.categoryRepository.create(categoryDto);
  }
}
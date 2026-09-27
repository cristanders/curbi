import { Request, Response } from 'express';
import { CategoryService } from '../service/categoryService';

export class CategoryController {
  private categoryService = new CategoryService();

  getCategories = async (req: Request, res: Response): Promise<Response> => {
    try {
      const categories = await this.categoryService.obtenerCategorias();
      return res.status(200).json(categories);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };

  createCategory = async (req: Request, res: Response): Promise<Response> => {
    try {
      const newCategory = await this.categoryService.crearCategoria(req.body);
      return res.status(201).json(newCategory);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };
}
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryDocument } from './schemas/category.schema';

@Injectable()
export class CategoriesService {
  // Injection du Repository, jamais du Model Mongoose directement.
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async create(dto: CreateCategoryDto): Promise<CategoryDocument> {
    // Règle métier : on vérifie l'unicité AVANT insertion pour renvoyer un message clair.
    // (L'index unique en base est un filet de sécurité, pas la première ligne de défense :
    // sans ce check, Mongo renverrait une erreur technique brute peu compréhensible pour l'utilisateur.)
    const existing = await this.categoriesRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException(`La catégorie "${dto.name}" existe déjà`);
    }
    return this.categoriesRepository.create(dto);
  }

  findAll(): Promise<CategoryDocument[]> {
    return this.categoriesRepository.findAll();
  }

  async findOne(id: string): Promise<CategoryDocument> {
    const category = await this.categoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Catégorie ${id} introuvable`);
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryDocument> {
    // On réutilise findOne : si la catégorie n'existe pas, l'exception 404 est déjà levée ici.
    await this.findOne(id);
    const updated = await this.categoriesRepository.update(id, dto);
    return updated as CategoryDocument;
  }

  async remove(id: string): Promise<CategoryDocument> {
    await this.findOne(id);
    const deleted = await this.categoriesRepository.delete(id);
    return deleted as CategoryDocument;
  }
}

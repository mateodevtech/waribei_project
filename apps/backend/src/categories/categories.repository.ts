import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';

// Cette classe est la SEULE à connaître Mongoose dans tout le module Category.
// Le Service ne verra jamais un "Model" Mongoose, seulement ces méthodes métier-neutres.
@Injectable()
export class CategoriesRepository {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  create(data: Partial<Category>): Promise<CategoryDocument> {
    return this.categoryModel.create(data);
  }

  findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel.find().exec();
  }

  findById(id: string): Promise<CategoryDocument | null> {
    return this.categoryModel.findById(id).exec();
  }

  findByName(name: string): Promise<CategoryDocument | null> {
    return this.categoryModel.findOne({ name }).exec();
  }

  update(id: string, data: Partial<Category>): Promise<CategoryDocument | null> {
    return this.categoryModel
      .findByIdAndUpdate(id, data, { new: true }) // new: true -> renvoie le document APRES mise à jour
      .exec();
  }

  delete(id: string): Promise<CategoryDocument | null> {
    return this.categoryModel.findByIdAndDelete(id).exec();
  }
}

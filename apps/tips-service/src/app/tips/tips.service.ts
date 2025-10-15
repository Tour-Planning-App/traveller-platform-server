// tips.service.ts
import { Inject, Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientGrpcProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Category } from './schemas/category.schema';
import { Tip } from './schemas/tip.schema';
import {
  CreateCategoryDto, CreateCategoryResponseDto,
  GetCategoriesDto, GetCategoriesResponseDto,
  GetCategoryByIdDto, GetCategoryResponseDto,
  UpdateCategoryDto, UpdateCategoryResponseDto,
  DeleteCategoryDto, DeleteCategoryResponseDto,
  CreateTipDto, CreateTipResponseDto,
  GetTipsDto, GetTipsResponseDto,
  GetTipByIdDto, GetTipResponseDto,
  UpdateTipDto, UpdateTipResponseDto,
  DeleteTipDto, DeleteTipResponseDto,
  GetAllUsersDto, GetAllUsersResponseDto,
} from './dtos/tips.dto';

@Injectable()
export class TipsService {
  private readonly logger = new Logger(TipsService.name);
  private userService: any;

  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Tip.name) private tipModel: Model<Tip>,
    @Inject('USER_PACKAGE') private userClient: ClientGrpcProxy,
  ) {
    this.userService = this.userClient.getService('UserService');
  }

  async createCategory(data: CreateCategoryDto): Promise<CreateCategoryResponseDto> {
    try {
      // Verify admin
      const admin = await firstValueFrom(this.userService.GetUserById({ id: data.adminId })) as any;
      if (!admin.data || admin.data.role !== 'admin') {
        throw new NotFoundException('Admin not authorized');
      }

      const category = new this.categoryModel({
        name: data.name,
        description: data.description,
      });
      await category.save();

      return { success: true, message: 'Category created', category: category.toObject() } as any;
    } catch (error) {
      this.logger.error(`CreateCategory error: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  async getCategories(data: GetCategoriesDto): Promise<GetCategoriesResponseDto> {
    try {
      const categories = await this.categoryModel
        .find()
        .limit(data.limit || 10)
        .skip(data.offset || 0)
        .exec();

      const total = await this.categoryModel.countDocuments();

      return { success: true, categories, total } as any;
    } catch (error) {
      this.logger.error(`GetCategories error: ${error.message}`);
      throw new BadRequestException('Failed to fetch categories');
    }
  }

  async getCategoryById(data: GetCategoryByIdDto): Promise<GetCategoryResponseDto> {
    try {
      const category = await this.categoryModel.findById(data.categoryId).exec();

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      return { success: true, category } as any;
    } catch (error) {
      this.logger.error(`GetCategoryById error: ${error.message}`);
      throw new BadRequestException('Failed to fetch category');
    }
  }

  async updateCategory(data: UpdateCategoryDto): Promise<UpdateCategoryResponseDto> {
    try {
      // Verify admin
      const admin = await firstValueFrom(this.userService.GetUserById({ id: data.adminId })) as any;
      if (!admin.data || admin.data.role !== 'admin') {
        throw new NotFoundException('Admin not authorized');
      }

      const category = await this.categoryModel.findByIdAndUpdate(
        data.categoryId,
        { $set: { name: data.name, description: data.description } },
        { new: true }
      ).exec();

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      return { success: true, message: 'Category updated', category } as any;
    } catch (error) {
      this.logger.error(`UpdateCategory error: ${error.message}`);
      throw new BadRequestException('Failed to update category');
    }
  }

  async deleteCategory(data: DeleteCategoryDto): Promise<DeleteCategoryResponseDto> {
    try {
      // Verify admin
      const admin = await firstValueFrom(this.userService.GetUserById({ id: data.adminId })) as any;
      if (!admin.data || admin.data.role !== 'admin') {
        throw new NotFoundException('Admin not authorized');
      }

      const category = await this.categoryModel.findByIdAndDelete(data.categoryId).exec();
      if (!category) {
        throw new NotFoundException('Category not found');
      }

      // Optionally delete associated tips
      await this.tipModel.deleteMany({ categoryId: data.categoryId }).exec();

      return { success: true, message: 'Category deleted' };
    } catch (error) {
      this.logger.error(`DeleteCategory error: ${error.message}`);
      throw new BadRequestException('Failed to delete category');
    }
  }

  async createTip(data: CreateTipDto): Promise<CreateTipResponseDto> {
    try {
      // Verify admin
      const admin = await firstValueFrom(this.userService.GetUserById({ id: data.adminId })) as any;
      if (!admin.data || admin.data.role !== 'admin') {
        throw new NotFoundException('Admin not authorized');
      }

      // Verify category exists
      const category = await this.categoryModel.findById(data.categoryId).exec();
      if (!category) {
        throw new NotFoundException('Category not found');
      }

      const tip = new this.tipModel({
        categoryId: data.categoryId,
        title: data.title,
        content: data.content,
        imageUrl: data.imageUrl,
      });
      await tip.save();

      return { success: true, message: 'Tip created', tip: tip.toObject() } as any;
    } catch (error) {
      this.logger.error(`CreateTip error: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  async getTips(data: GetTipsDto): Promise<GetTipsResponseDto> {
    try {
      let query: any = {};
      if (data.categoryId) query.categoryId = data.categoryId;

      const tips = await this.tipModel
        .find(query)
        .populate('categoryId', 'name')
        .limit(data.limit || 10)
        .skip(data.offset || 0)
        .exec();

      const total = await this.tipModel.countDocuments(query);

      return { success: true, tips, total } as any;
    } catch (error) {
      this.logger.error(`GetTips error: ${error.message}`);
      throw new BadRequestException('Failed to fetch tips');
    }
  }

  async getTipById(data: GetTipByIdDto): Promise<GetTipResponseDto> {
    try {
      const tip = await this.tipModel
        .findById(data.tipId)
        .populate('categoryId', 'name')
        .exec();

      if (!tip) {
        throw new NotFoundException('Tip not found');
      }

      return { success: true, tip } as any;
    } catch (error) {
      this.logger.error(`GetTipById error: ${error.message}`);
      throw new BadRequestException('Failed to fetch tip');
    }
  }

  async updateTip(data: UpdateTipDto): Promise<UpdateTipResponseDto> {
    try {
      // Verify admin
      const admin = await firstValueFrom(this.userService.GetUserById({ id: data.adminId })) as any;
      if (!admin.data || admin.data.role !== 'admin') {
        throw new NotFoundException('Admin not authorized');
      }

      // Verify category exists
      const category = await this.categoryModel.findById(data.categoryId).exec();
      if (!category) {
        throw new NotFoundException('Category not found');
      }

      const tip = await this.tipModel.findByIdAndUpdate(
        data.tipId,
        { $set: { categoryId: data.categoryId, title: data.title, content: data.content, imageUrl: data.imageUrl } },
        { new: true }
      ).exec();

      if (!tip) {
        throw new NotFoundException('Tip not found');
      }

      return { success: true, message: 'Tip updated', tip } as any;
    } catch (error) {
      this.logger.error(`UpdateTip error: ${error.message}`);
      throw new BadRequestException('Failed to update tip');
    }
  }

  async deleteTip(data: DeleteTipDto): Promise<DeleteTipResponseDto> {
    try {
      // Verify admin
      const admin = await firstValueFrom(this.userService.GetUserById({ id: data.adminId })) as any;
      if (!admin.data || admin.data.role !== 'admin') {
        throw new NotFoundException('Admin not authorized');
      }

      const tip = await this.tipModel.findByIdAndDelete(data.tipId).exec();
      if (!tip) {
        throw new NotFoundException('Tip not found');
      }

      return { success: true, message: 'Tip deleted' };
    } catch (error) {
      this.logger.error(`DeleteTip error: ${error.message}`);
      throw new BadRequestException('Failed to delete tip');
    }
  }

  async getAllUsers(data: GetAllUsersDto): Promise<GetAllUsersResponseDto> {
    try {
      // Verify admin
      const admin = await firstValueFrom(this.userService.GetUserById({ id: data.adminId })) as any;
      if (!admin.data || admin.data.role !== 'admin') {
        throw new NotFoundException('Admin not authorized');
      }

      // Fetch all users via UserService
      const users = await firstValueFrom(this.userService.GetAllUsers({ limit: data.limit, offset: data.offset })) as any;

      return { success: true, users: users.users || [], total: users.total || 0 } as any;
    } catch (error) {
      this.logger.error(`GetAllUsers error: ${error.message}`);
      throw new BadRequestException('Failed to fetch users');
    }
  }
}
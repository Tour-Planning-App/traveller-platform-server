import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto } from './dtos/user.dto';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
      private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<any> {
    try {
      const existingUser = await this.userModel.findOne({ email: createUserDto.email }).exec();
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const user = new this.userModel({ 
        ...createUserDto, 
        password: hashedPassword,
        role: 'traveler' 
      });
      return await user.save();
    } catch (error) {
      this.logger.error(`CreateUser error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createAdminUser(createUserDto: CreateUserDto): Promise<any> {
    try {
      const existingUser = await this.userModel.findOne({ email: createUserDto.email }).exec();
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const user = new this.userModel({ 
        ...createUserDto, 
        password: hashedPassword,
        role: 'admin' 
      });
      return await user.save();
    } catch (error) {
      this.logger.error(`CreateAdminUser error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUser(email: string): Promise<User> {
    try {
      const user = await this.userModel.findOne({ email }).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      this.logger.error(`GetUser error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUserById(id: string): Promise<User> {
    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      this.logger.error(`GetUserById error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateUser(updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const user = await this.userModel.findOne({ email: updateUserDto.email }).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (updateUserDto.password) {
        user.password = await bcrypt.hash(updateUserDto.password, 10);
      }
      if (updateUserDto.name) user.name = updateUserDto.name;
      if (updateUserDto.preferredLanguage) user.preferredLanguage = updateUserDto.preferredLanguage;
      if (updateUserDto.preferredCurrency) user.preferredCurrency = updateUserDto.preferredCurrency;

      return await user.save();
    } catch (error) {
      this.logger.error(`UpdateUser error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteUser(email: string): Promise<void> {
    try {
      const user = await this.userModel.findOne({ email }).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }
      await this.userModel.deleteOne({ email }).exec();
    } catch (error) {
      this.logger.error(`DeleteUser error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateProfile(updateProfileDto: UpdateProfileDto): Promise<User> {
    try {
      const user = await this.userModel.findOne({ email: updateProfileDto.email }).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (updateProfileDto.name) user.name = updateProfileDto.name;
      if (updateProfileDto.preferredLanguage) user.preferredLanguage = updateProfileDto.preferredLanguage;
      if (updateProfileDto.preferredCurrency) user.preferredCurrency = updateProfileDto.preferredCurrency;

      return await user.save();
    } catch (error) {
      this.logger.error(`UpdateProfile error: ${error.message}`, error.stack);
      throw error;
    }
  }
}

import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto } from './dtos/user.dto';
import { BadRequestException } from '@nestjs/common';


@Controller('user')
export class UserController {
   private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @GrpcMethod('UserService', 'CreateUser')
  async createUser(@Payload() data: CreateUserDto) {
    try {
      const result = await this.userService.createUser(data);
      return { status: 200, message: 'User created successfully', id: result._id };
    } catch (error: any) {
      this.logger.error(`gRPC CreateUser error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('UserService', 'GetUser')
  async getUser(@Payload() data: { email: string }) {
    try {
      const result = await this.userService.getUser(data.email);
      return { status: 200, message: 'User fetched successfully', data: result };
    } catch (error: any) {
      this.logger.error(`gRPC GetUser error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('UserService', 'GetUserById')
  async getUserById(@Payload() data: { id: string }) {
    try {
      const result = await this.userService.getUserById(data.id);
      return { status: 200, message: 'User fetched successfully', data: result };
    } catch (error: any) {
      this.logger.error(`gRPC GetUserById error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('UserService', 'UpdateUser')
  async updateUser(@Payload() data: UpdateUserDto) {
    try {
      const result = await this.userService.updateUser(data);
      return { status: 200, message: 'User updated successfully', id: result._id };
    } catch (error: any) {
      this.logger.error(`gRPC UpdateUser error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('UserService', 'DeleteUser')
  async deleteUser(@Payload() data: { email: string }) {
    try {
      const result = await this.userService.deleteUser(data.email);
      return { status: 200, message: 'User deleted successfully' };
    } catch (error: any) {
      this.logger.error(`gRPC DeleteUser error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('UserService', 'UpdateProfile')
  async updateProfile(@Payload() data: UpdateProfileDto) {
    try {
      const result = await this.userService.updateProfile(data);
      return { status: 200, message: 'Profile updated successfully', id: result._id };
    } catch (error: any) {
      this.logger.error(`gRPC UpdateProfile error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }
}

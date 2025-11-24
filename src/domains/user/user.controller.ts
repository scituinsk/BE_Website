import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseBuilder } from '../../common/utils/response.util';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('/')
  async getAllUsers() {
    const users = await this.userService.findAll();
    return ResponseBuilder.success(users);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('/:userId')
  async deleteUserById(@Param('userId', ParseIntPipe) userId: number) {
    await this.userService.delete(userId);
    return ResponseBuilder.noContent('Success delete user');
  }
}

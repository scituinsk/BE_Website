import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ResponseUtil } from '../../common/utils/response.util';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@CurrentUser() user: any) {
    const userData = await this.userService.findById(user.userId);
    if (!userData) {
      throw new NotFoundException('User not found');
    }

    const avatarUrl = await this.userService.getAvatarUrl(user.userId);

    const { password, ...result } = userData;
    return ResponseUtil.success({ ...result, avatarUrl });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const avatarUrl = await this.userService.getAvatarUrl(id);

    const { password, ...result } = user;
    return ResponseUtil.success({ ...result, avatarUrl });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/avatar')
  async getMyAvatar(@CurrentUser() user: any) {
    const avatarUrl = await this.userService.getAvatarUrl(user.userId);
    if (!avatarUrl) {
      throw new NotFoundException('Avatar not found');
    }
    return ResponseUtil.success({ avatarUrl });
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async updateAvatar(
    @CurrentUser() user: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const avatarUrl = await this.userService.updateAvatar(user.userId, file);
    return ResponseUtil.success({ avatarUrl }, 'Avatar updated successfully');
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/avatar')
  async deleteAvatar(@CurrentUser() user: any) {
    await this.userService.deleteAvatar(user.userId);
    return ResponseUtil.success(null, 'Avatar deleted successfully');
  }
}

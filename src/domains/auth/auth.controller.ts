import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  COOKIE_ACCESS_TOKEN_MAX_AGE,
  COOKIE_REFRESH_TOKEN_MAX_AGE,
  COOKIE_ACCESS_TOKEN_NAME,
  COOKIE_REFRESH_TOKEN_NAME,
} from '../auth/auth.constants';
import { ResponseBuilder } from 'src/utils/response-builder.util';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(JwtRefreshAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @CurrentUser() user: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Extract device info and IP
    const deviceInfo = req.headers['user-agent'] || 'Unknown device';
    const ipAddress = (req.ip || req.socket.remoteAddress) as string;

    const result = await this.authService.signIn(user, deviceInfo, ipAddress);

    // Set tokens in cookies
    res.cookie(COOKIE_ACCESS_TOKEN_NAME, result.data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_ACCESS_TOKEN_MAX_AGE,
    });

    res.cookie(COOKIE_REFRESH_TOKEN_NAME, result.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_REFRESH_TOKEN_MAX_AGE,
    });

    return ResponseBuilder.created(result, 'User created successfully');
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refreshTokens(
      user.userId,
      user.refreshToken,
    );

    // Update cookies with new tokens
    res.cookie(COOKIE_ACCESS_TOKEN_NAME, result.data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_ACCESS_TOKEN_MAX_AGE,
    });

    res.cookie(COOKIE_REFRESH_TOKEN_NAME, result.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_REFRESH_TOKEN_MAX_AGE,
    });

    return result;
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Post('signout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Clear cookies
    res.clearCookie(COOKIE_ACCESS_TOKEN_NAME);
    res.clearCookie(COOKIE_REFRESH_TOKEN_NAME);

    return this.authService.logout(user.userId, user.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Clear cookies
    res.clearCookie(COOKIE_ACCESS_TOKEN_NAME);
    res.clearCookie(COOKIE_REFRESH_TOKEN_NAME);

    return this.authService.logoutAll(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('session')
  getSession(@CurrentUser() user: any) {
    return ResponseBuilder.success(user);
  }
}

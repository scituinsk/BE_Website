import * as bcrypt from 'bcrypt';
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { SignUpDto } from './dto/signup.dto';
import { UserService } from '../user/user.service';
import { SessionService } from './session.service';
import { ResponseBuilder } from '../../utils/response-builder.util';
import {
  JWT_ACCESS_TOKEN_EXPIRATION,
  JWT_REFRESH_TOKEN_EXPIRATION,
} from '../auth/auth.constants';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private sessionService: SessionService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  async signUp(signUpDto: SignUpDto) {
    // Check if user already exists
    const existingUser = await this.usersService.findOne(signUpDto.username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const user = await this.usersService.create(signUpDto);
    const { password: _, ...result } = user;

    return result;
  }

  async signIn(user: any, deviceInfo?: string, ipAddress?: string) {
    const tokens = await this.getTokens(user.id, user.username, user.role);

    // Calculate refresh token expiration
    const expiresAt = this.calculateTokenExpiration(
      JWT_REFRESH_TOKEN_EXPIRATION,
    );

    // Create new session
    await this.sessionService.createSession(
      user.id,
      tokens.refreshToken,
      expiresAt,
      deviceInfo,
      ipAddress,
    );

    return {
      ...tokens,
    };
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const session = await this.sessionService.findSessionByToken(
      userId,
      refreshToken,
    );

    if (!session || session.userId !== userId) {
      throw new UnauthorizedException('Access Denied');
    }

    // Check if session is expired
    if (new Date() > session.expiresAt) {
      await this.sessionService.deleteSession(session.id);
      throw new UnauthorizedException('Session expired');
    }

    const user = session.user;
    const tokens = await this.getTokens(user.id, user.username, user.role);

    // Update session with new refresh token
    const expiresAt = this.calculateTokenExpiration(
      JWT_REFRESH_TOKEN_EXPIRATION,
    );
    await this.sessionService.updateSession(
      session.id,
      tokens.refreshToken,
      expiresAt,
    );

    return ResponseBuilder.success(tokens, 'Tokens refreshed successfully');
  }

  async logout(userId: number, refreshToken: string) {
    const session = await this.sessionService.findSessionByToken(
      userId,
      refreshToken,
    );

    if (session && session.userId === userId) {
      await this.sessionService.deleteSession(session.id);
    }

    return ResponseBuilder.success(null, 'Logged out successfully');
  }

  async logoutAll(userId: number) {
    await this.sessionService.deleteUserSessions(userId);
    return ResponseBuilder.success(
      null,
      'Logged out from all devices successfully',
    );
  }

  private async getTokens(userId: number, username: string, role: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          username,
          role,
        },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: JWT_ACCESS_TOKEN_EXPIRATION,
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          username,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: JWT_REFRESH_TOKEN_EXPIRATION,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private calculateTokenExpiration(expiration: string): Date {
    // Parse expiration string like "7d", "24h", "60m"
    const value = parseInt(expiration.slice(0, -1));
    const unit = expiration.slice(-1);

    const now = new Date();
    switch (unit) {
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
    }
  }
}

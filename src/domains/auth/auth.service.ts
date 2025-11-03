import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { SignUpDto } from './dto/signup.dto';
import { ResponseUtil } from '../../common/utils/response.util';
import {
  JWT_ACCESS_TOKEN_EXPIRATION,
  JWT_REFRESH_TOKEN_EXPIRATION,
} from '../../common/constants/auth.constants';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
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

    const { password: _, refreshToken: __, ...result } = user;
    return result;
  }

  async signUp(signUpDto: SignUpDto) {
    // Check if user already exists
    const existingUser = await this.usersService.findOne(signUpDto.username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Create new user
    const user = await this.usersService.create(signUpDto);
    const { password: _, refreshToken: __, ...result } = user;

    return ResponseUtil.created(result, 'User created successfully');
  }

  async signIn(user: any) {
    const tokens = await this.getTokens(user.id, user.username, user.role);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return ResponseUtil.success(
      {
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
        },
        ...tokens,
      },
      'Login successful',
    );
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access Denied');
    }

    const tokens = await this.getTokens(user.id, user.username, user.role);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return ResponseUtil.success(tokens, 'Tokens refreshed successfully');
  }

  async logout(userId: number) {
    await this.usersService.updateRefreshToken(userId, null);
    return ResponseUtil.success(null, 'Logged out successfully');
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
}

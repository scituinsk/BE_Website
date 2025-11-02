import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { COOKIE_REFRESH_TOKEN_NAME } from '../../../common/constants/auth.constants';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Extract from cookie first
        (request: Request) => {
          return request?.cookies?.[COOKIE_REFRESH_TOKEN_NAME];
        },
        // Then try from body field
        ExtractJwt.fromBodyField('refreshToken'),
      ]),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_REFRESH_SECRET') ||
        'default-refresh-secret',
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: any) {
    // Get refresh token from cookie or body
    const refreshToken =
      request?.cookies?.[COOKIE_REFRESH_TOKEN_NAME] ||
      request?.body?.refreshToken;
    return {
      userId: payload.sub,
      username: payload.username,
      refreshToken,
    };
  }
}

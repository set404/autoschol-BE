import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { RefreshTokenPayload } from '../types';

function extractRefreshTokenFromBody(req: Request): string | null {
  return typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: extractRefreshTokenFromBody,
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: false,
    });
  }

  validate(payload: RefreshTokenPayload): RefreshTokenPayload {
    return payload;
  }
}

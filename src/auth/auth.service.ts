import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { Role, User } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { toPublicUser, PublicUser } from '../users/user.mapper';
import type { AccessTokenPayload, RefreshTokenPayload } from './types';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(params: { email: string; password: string; name: string }): Promise<AuthResult> {
    const passwordHash = await argon2.hash(params.password);
    const user = await this.usersService.createUser({
      email: params.email,
      passwordHash,
      name: params.name,
      role: Role.STUDENT,
    });
    return this.issueTokensAndPersist(user);
  }

  async login(params: { email: string; password: string }): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(params.email);
    if (!user || !(await argon2.verify(user.passwordHash, params.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.issueTokensAndPersist(user);
  }

  async refresh(refreshToken: string, payload: RefreshTokenPayload): Promise<AuthResult> {
    const user = await this.usersService.findByIdOrThrow(payload.sub).catch(() => null);
    if (!user || !user.refreshTokenHash || !(await argon2.verify(user.refreshTokenHash, refreshToken))) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return this.issueTokensAndPersist(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.usersService.findByIdOrThrow(userId);
    return toPublicUser(user);
  }

  private async issueTokensAndPersist(user: User): Promise<AuthResult> {
    const tokens = await this.generateTokens(user);
    const refreshTokenHash = await argon2.hash(tokens.refreshToken);
    await this.usersService.setRefreshTokenHash(user.id, refreshTokenHash);
    return { ...tokens, user: toPublicUser(user) };
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const accessPayload: AccessTokenPayload = { sub: user.id, email: user.email, role: user.role };
    const refreshPayload: RefreshTokenPayload = { sub: user.id };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: (this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m') as never,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '30d') as never,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}

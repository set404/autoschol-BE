import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards, Get } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, AuthResult } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser, RefreshTokenPayload } from './types';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import type { PublicUser } from '../users/user.mapper';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthResult> {
    return this.authService.register(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto): Promise<AuthResult> {
    return this.authService.login(dto);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() dto: RefreshDto, @Req() req: Request): Promise<AuthResult> {
    const payload = req.user as RefreshTokenPayload;
    return this.authService.refresh(dto.refreshToken, payload);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@CurrentUser() user: AuthenticatedUser): Promise<{ success: true }> {
    await this.authService.logout(user.id);
    return { success: true };
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): Promise<PublicUser> {
    return this.authService.getProfile(user.id);
  }
}

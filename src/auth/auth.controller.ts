import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import sharp from 'sharp';
import { AuthService, AuthResult } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser, RefreshTokenPayload } from './types';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { UsersService } from '../users/users.service';
import { toPublicUser, type PublicUser } from '../users/user.mapper';

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_SIZE_PX = 256;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

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

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: AVATAR_MAX_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(new BadRequestException('File must be an image'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<PublicUser> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const resized = await sharp(file.buffer)
      .resize(AVATAR_SIZE_PX, AVATAR_SIZE_PX, { fit: 'cover' })
      .jpeg({ quality: 82 })
      .toBuffer();
    const updated = await this.usersService.setAvatar(user.id, resized);
    return toPublicUser(updated);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('me/avatar')
  async removeAvatar(@CurrentUser() user: AuthenticatedUser): Promise<PublicUser> {
    const updated = await this.usersService.clearAvatar(user.id);
    return toPublicUser(updated);
  }
}

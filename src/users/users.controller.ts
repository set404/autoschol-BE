import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, StreamableFile } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { toPublicUser, PublicUser } from './user.mapper';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.ADMIN)
  @Get()
  async list(@Query('role') role?: Role): Promise<PublicUser[]> {
    const users = await this.usersService.list(role);
    return users.map(toPublicUser);
  }

  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() dto: CreateUserDto): Promise<PublicUser> {
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.usersService.createUser({
      email: dto.email,
      passwordHash,
      name: dto.name,
      role: dto.role,
    });
    return toPublicUser(user);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/role')
  async updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto): Promise<PublicUser> {
    const user = await this.usersService.updateRole(id, dto.role);
    return toPublicUser(user);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: true }> {
    await this.usersService.remove(id);
    return { success: true };
  }

  @Public()
  @Get(':id/avatar')
  async getAvatar(@Param('id') id: string): Promise<StreamableFile> {
    const bytes = await this.usersService.getAvatarBytes(id);
    if (!bytes) {
      throw new NotFoundException();
    }
    return new StreamableFile(Buffer.from(bytes), { type: 'image/jpeg', disposition: 'inline' });
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { toPublicUser, PublicUser } from './user.mapper';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async list(@Query('role') role?: Role): Promise<PublicUser[]> {
    const users = await this.usersService.list(role);
    return users.map(toPublicUser);
  }

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

  @Patch(':id/role')
  async updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto): Promise<PublicUser> {
    const user = await this.usersService.updateRole(id, dto.role);
    return toPublicUser(user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: true }> {
    await this.usersService.remove(id);
    return { success: true };
  }
}

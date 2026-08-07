import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async createUser(params: { email: string; passwordHash: string; name: string; role: Role }): Promise<User> {
    const existing = await this.findByEmail(params.email);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }
    return this.prisma.user.create({ data: params });
  }

  setRefreshTokenHash(userId: string, refreshTokenHash: string | null): Promise<User> {
    return this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash } });
  }

  list(role?: Role): Promise<User[]> {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateRole(id: string, role: Role): Promise<User> {
    await this.findByIdOrThrow(id);
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  async remove(id: string): Promise<void> {
    await this.findByIdOrThrow(id);
    await this.prisma.user.delete({ where: { id } });
  }
}

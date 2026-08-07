import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { Roles } from '../common/decorators/roles.decorator';
import type { AssignmentResponse } from './assignment.mapper';

@Controller('admin')
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('assignments')
  listAssignments(): Promise<AssignmentResponse[]> {
    return this.adminService.listAssignments();
  }

  @Post('assignments')
  createAssignment(@Body() dto: CreateAssignmentDto): Promise<AssignmentResponse> {
    return this.adminService.createAssignment(dto);
  }

  @Delete('assignments/:id')
  async removeAssignment(@Param('id') id: string): Promise<{ success: true }> {
    await this.adminService.removeAssignment(id);
    return { success: true };
  }
}

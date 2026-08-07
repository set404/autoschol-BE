import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { TestsService } from './tests.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { TestSummaryResponse } from './test.mapper';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Get()
  findAll(): Promise<TestSummaryResponse[]> {
    return this.testsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<TestSummaryResponse> {
    return this.testsService.findByIdOrThrow(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateTestDto): Promise<TestSummaryResponse> {
    return this.testsService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTestDto): Promise<TestSummaryResponse> {
    return this.testsService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: true }> {
    await this.testsService.remove(id);
    return { success: true };
  }
}

import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionResponse } from './question.mapper';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  findByIds(@Query('ids') ids?: string): Promise<QuestionResponse[]> {
    if (!ids) {
      throw new BadRequestException('The "ids" query parameter is required, e.g. ?ids=1,2,3');
    }
    const idList = ids
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    return this.questionsService.findByIds(idList);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<QuestionResponse> {
    return this.questionsService.findByIdOrThrow(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateQuestionDto): Promise<QuestionResponse> {
    return this.questionsService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQuestionDto): Promise<QuestionResponse> {
    return this.questionsService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: true }> {
    await this.questionsService.remove(id);
    return { success: true };
  }
}

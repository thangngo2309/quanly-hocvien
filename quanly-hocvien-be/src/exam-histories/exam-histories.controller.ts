import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ExamHistoriesService } from './exam-histories.service';
import { CreateExamHistoryDto } from './dto/create-exam-history.dto';
import { UpdateExamHistoryDto } from './dto/update-exam-history.dto';

@Controller('exam-histories')
export class ExamHistoriesController {
  constructor(private readonly examHistoriesService: ExamHistoriesService) {}

  @Post()
  create(@Body() createExamHistoryDto: CreateExamHistoryDto) {
    return this.examHistoriesService.create(createExamHistoryDto);
  }

  @Get()
  findAll(@Query('student_id') studentId?: string) {
    return this.examHistoriesService.findAll(
      studentId ? Number(studentId) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examHistoriesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateExamHistoryDto: UpdateExamHistoryDto,
  ) {
    return this.examHistoriesService.update(+id, updateExamHistoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.examHistoriesService.remove(+id);
  }
}

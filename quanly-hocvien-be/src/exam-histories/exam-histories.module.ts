import { Module } from '@nestjs/common';
import { ExamHistoriesService } from './exam-histories.service';
import { ExamHistoriesController } from './exam-histories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamHistory } from './entities/exam-history.entity';
import { Student } from 'src/students/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExamHistory, Student])],
  controllers: [ExamHistoriesController],
  providers: [ExamHistoriesService],
  exports: [ExamHistoriesService, TypeOrmModule],
})
export class ExamHistoriesModule {}

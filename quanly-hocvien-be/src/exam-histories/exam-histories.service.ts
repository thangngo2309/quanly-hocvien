import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateExamHistoryDto } from './dto/create-exam-history.dto';
import { UpdateExamHistoryDto } from './dto/update-exam-history.dto';
import { ExamHistory } from './entities/exam-history.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from 'src/students/entities/student.entity';

@Injectable()
export class ExamHistoriesService {
  constructor(
    @InjectRepository(ExamHistory)
    private readonly examHistoryRepo: Repository<ExamHistory>,

    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  async create(createDto: CreateExamHistoryDto) {
    const student = await this.studentRepo.findOne({
      where: { id: createDto.student_id },
    });

    if (!student) {
      throw new NotFoundException('Không tìm thấy học viên');
    }

    const examHistory = this.examHistoryRepo.create({
      student,
      exam_type: createDto.exam_type,
      exam_date: createDto.exam_date ? new Date(createDto.exam_date) : null,
      result: createDto.result,
      retake_date: createDto.retake_date ? new Date(createDto.retake_date) : null,
      note: createDto.note ?? null,
    });

    return this.examHistoryRepo.save(examHistory);
  }

  findAll(studentId?: number) {
    const where = studentId
      ? {
          student: {
            id: studentId,
          },
        }
      : {};

    return this.examHistoryRepo.find({
      where,
      relations: ['student'],
      order: {
        exam_date: 'DESC',
        id: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    const examHistory = await this.examHistoryRepo.findOne({
      where: { id },
      relations: ['student'],
    });

    if (!examHistory) {
      throw new NotFoundException('Không tìm thấy lịch sử thi');
    }

    return examHistory;
  }

  async update(id: number, updateDto: UpdateExamHistoryDto) {
    const examHistory = await this.findOne(id);

    if (updateDto.exam_type !== undefined) {
      examHistory.exam_type = updateDto.exam_type;
    }

    if (updateDto.exam_date !== undefined) {
      examHistory.exam_date = updateDto.exam_date
        ? new Date(updateDto.exam_date)
        : null;
    }

    if (updateDto.result !== undefined) {
      examHistory.result = updateDto.result;
    }

    if (updateDto.retake_date !== undefined) {
      examHistory.retake_date = updateDto.retake_date
        ? new Date(updateDto.retake_date)
        : null;
    }

    if (updateDto.note !== undefined) {
      examHistory.note = updateDto.note || null;
    }

    return this.examHistoryRepo.save(examHistory);
  }

  async remove(id: number) {
    const examHistory = await this.findOne(id);

    await this.examHistoryRepo.remove(examHistory);

    return {
      message: 'Xóa lịch sử thi thành công',
    };
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course } from './entities/course.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) {}

  async create(createCourseDto: CreateCourseDto) {
    const startDate = createCourseDto.start_date
      ? new Date(createCourseDto.start_date)
      : undefined;

    const endDate = createCourseDto.end_date
      ? new Date(createCourseDto.end_date)
      : undefined;

    const course = this.courseRepo.create({
      name: createCourseDto.name,
      code: createCourseDto.code ?? "",
      start_date: startDate,
      end_date: endDate,
      year: createCourseDto.year ?? startDate?.getFullYear() ?? 0,
      status: createCourseDto.status ?? 'OPEN',
      note: createCourseDto.note ?? "",
    });

    return this.courseRepo.save(course);
  }

  findAll() {
    return this.courseRepo.find({
      order: {
        id: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: [
        'enrollments',
        'enrollments.student',
        'enrollments.tuition_payments',
        'enrollments.expenses',
        'expenses',
      ],
    });

    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    return course;
  }

  async update(id: number, updateCourseDto: UpdateCourseDto) {
    const course = await this.courseRepo.findOne({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    if (updateCourseDto.name !== undefined) {
      course.name = updateCourseDto.name;
    }

    if (updateCourseDto.code !== undefined) {
      course.code = updateCourseDto.code;
    }

    if (updateCourseDto.start_date !== undefined) {
      course.start_date = updateCourseDto.start_date
        ? new Date(updateCourseDto.start_date)
        : undefined;
    }

    if (updateCourseDto.end_date !== undefined) {
      course.end_date = updateCourseDto.end_date
        ? new Date(updateCourseDto.end_date)
        : undefined;
    }

    if (updateCourseDto.year !== undefined) {
      course.year = updateCourseDto.year;
    }

    if (updateCourseDto.status !== undefined) {
      course.status = updateCourseDto.status;
    }

    if (updateCourseDto.note !== undefined) {
      course.note = updateCourseDto.note;
    }

    return this.courseRepo.save(course);
  }

  async remove(id: number) {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['enrollments'],
    });

    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    if (course.enrollments && course.enrollments.length > 0) {
      throw new BadRequestException(
        'Không thể xóa khóa học vì khóa học đã có học viên',
      );
    }

    await this.courseRepo.remove(course);

    return {
      message: 'Xóa khóa học thành công',
    };
  }

  async closeFinance(id: number) {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['enrollments', 'enrollments.tuition_payments'],
    });
  
    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }
  
    if (course.status === 'FINISHED') {
      throw new BadRequestException('Khóa học đã kết thúc');
    }
  
    if (course.is_finance_closed) {
      throw new BadRequestException('Khóa học đã được chốt thu chi');
    }
  
    const unpaidEnrollments = (course.enrollments || []).filter(enrollment => {
      const tuitionFee = Number(enrollment.tuition_fee || 0);
  
      const totalPaid = (enrollment.tuition_payments || []).reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0,
      );
  
      return totalPaid < tuitionFee;
    });
  
    if (unpaidEnrollments.length > 0) {
      throw new BadRequestException(
        `Không thể chốt thu chi vì còn ${unpaidEnrollments.length} học viên chưa đóng đủ học phí`,
      );
    }
  
    course.is_finance_closed = true;
    course.finance_closed_at = new Date();
  
    return this.courseRepo.save(course);
  }
  
  async finishCourse(id: number) {
    const course = await this.courseRepo.findOne({
      where: { id },
    });
  
    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }
  
    if (course.status === 'FINISHED') {
      throw new BadRequestException('Khóa học đã kết thúc');
    }
  
    if (!course.is_finance_closed) {
      throw new BadRequestException(
        'Vui lòng chốt thu chi trước khi kết thúc khóa học',
      );
    }
  
    course.status = 'FINISHED';
    course.finished_at = new Date();
  
    return this.courseRepo.save(course);
  }
}

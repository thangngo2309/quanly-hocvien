import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Enrollment } from './entities/enrollment.entity';
import { Repository } from 'typeorm';
import { Student } from 'src/students/entities/student.entity';
import { Course } from 'src/courses/entities/course.entity';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,

    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,

    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) {}

  async create(createEnrollmentDto: CreateEnrollmentDto) {
    const student = await this.studentRepo.findOne({
      where: { id: createEnrollmentDto.student_id },
    });
  
    if (!student) {
      throw new NotFoundException('Không tìm thấy học viên');
    }
  
    const course = await this.courseRepo.findOne({
      where: { id: createEnrollmentDto.course_id },
    });
  
    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    if (course.status === 'FINISHED' || course.is_finance_closed) {
      throw new BadRequestException(
        'Khóa học đã chốt thu chi hoặc đã kết thúc, không thể thêm học viên',
      );
    }
  
    const existedEnrollment = await this.enrollmentRepo.findOne({
      where: {
        student: {
          id: createEnrollmentDto.student_id,
        },
        course: {
          id: createEnrollmentDto.course_id,
        },
      },
    });
  
    if (existedEnrollment) {
      throw new BadRequestException('Học viên này đã được thêm vào khóa học');
    }
  
    const tuitionFee = createEnrollmentDto.tuition_fee ?? 0;
  
    const firstExpected =
      createEnrollmentDto.first_payment_expected ?? Math.floor(tuitionFee / 2);
  
    const secondExpected =
      createEnrollmentDto.second_payment_expected ?? tuitionFee - firstExpected;
  
    const enrollment = this.enrollmentRepo.create({
      student,
      course,
      tuition_fee: tuitionFee,
      first_payment_expected: firstExpected,
      second_payment_expected: secondExpected,
      status: createEnrollmentDto.status ?? 'STUDYING',
      note: createEnrollmentDto.note ?? undefined,
    });
  
    return this.enrollmentRepo.save(enrollment);
  }

  findAll() {
    return this.enrollmentRepo.find({
      relations: ['student', 'course', 'tuition_payments', 'expenses'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id },
      relations: ['student', 'course', 'tuition_payments', 'expenses'],
    });

    if (!enrollment) {
      throw new NotFoundException('Không tìm thấy học viên trong khóa');
    }

    return enrollment;
  }

  async update(id: number, updateEnrollmentDto: UpdateEnrollmentDto) {
    const enrollment = await this.findOne(id);

    Object.assign(enrollment, {
      tuition_fee: updateEnrollmentDto.tuition_fee ?? enrollment.tuition_fee,
      first_payment_expected:
        updateEnrollmentDto.first_payment_expected ??
        enrollment.first_payment_expected,
      second_payment_expected:
        updateEnrollmentDto.second_payment_expected ??
        enrollment.second_payment_expected,
      status: updateEnrollmentDto.status ?? enrollment.status,
      note: updateEnrollmentDto.note ?? enrollment.note,
    });

    return this.enrollmentRepo.save(enrollment);
  }

  async remove(id: number) {
    const enrollment = await this.findOne(id);
    return this.enrollmentRepo.remove(enrollment);
  }
}

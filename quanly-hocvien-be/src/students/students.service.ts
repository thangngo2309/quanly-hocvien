import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Student } from './entities/student.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  async create(createStudentDto: CreateStudentDto) {
    const student = this.studentRepo.create({
      full_name: createStudentDto.full_name,
      date_of_birth: createStudentDto.date_of_birth
        ? new Date(createStudentDto.date_of_birth)
        : null,
      phone: createStudentDto.phone ?? null,
      avatar_url: createStudentDto.avatar_url ?? null,
  
      identity_number: createStudentDto.identity_number ?? null,
      identity_issue_date: createStudentDto.identity_issue_date
        ? new Date(createStudentDto.identity_issue_date)
        : null,
      identity_issue_place: createStudentDto.identity_issue_place ?? null,
  
      previous_license_number:
        createStudentDto.previous_license_number ?? null,
      previous_license_class:
        createStudentDto.previous_license_class ?? null,
      previous_license_issue_place:
        createStudentDto.previous_license_issue_place ?? null,
      previous_license_issue_date:
        createStudentDto.previous_license_issue_date
          ? new Date(createStudentDto.previous_license_issue_date)
          : null,
    });
  
    return this.studentRepo.save(student);
  }

  findAll() {
    return this.studentRepo.find({
      order: {
        id: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    const student = await this.studentRepo.findOne({
      where: { id },
      relations: [
        'enrollments',
        'enrollments.course',
        'enrollments.tuition_payments',
        'enrollments.expenses',
      ],
    });

    if (!student) {
      throw new NotFoundException('Không tìm thấy học viên');
    }

    return student;
  }

  async update(id: number, updateStudentDto: UpdateStudentDto) {
    const student = await this.studentRepo.findOne({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException('Không tìm thấy học viên');
    }

    if (updateStudentDto.full_name !== undefined) {
      student.full_name = updateStudentDto.full_name;
    }

    if (updateStudentDto.date_of_birth !== undefined) {
      student.date_of_birth = updateStudentDto.date_of_birth
        ? new Date(updateStudentDto.date_of_birth)
        : null;
    }

    if (updateStudentDto.phone !== undefined) {
      student.phone = updateStudentDto.phone;
    }

    if (updateStudentDto.avatar_url !== undefined) {
      student.avatar_url = updateStudentDto.avatar_url;
    }

    if (updateStudentDto.identity_number !== undefined) {
      student.identity_number = updateStudentDto.identity_number || null;
    }
    
    if (updateStudentDto.identity_issue_date !== undefined) {
      student.identity_issue_date = updateStudentDto.identity_issue_date
        ? new Date(updateStudentDto.identity_issue_date)
        : null;
    }
    
    if (updateStudentDto.identity_issue_place !== undefined) {
      student.identity_issue_place = updateStudentDto.identity_issue_place || null;
    }
    
    if (updateStudentDto.previous_license_number !== undefined) {
      student.previous_license_number =
        updateStudentDto.previous_license_number || null;
    }
    
    if (updateStudentDto.previous_license_class !== undefined) {
      student.previous_license_class =
        updateStudentDto.previous_license_class || null;
    }
    
    if (updateStudentDto.previous_license_issue_place !== undefined) {
      student.previous_license_issue_place =
        updateStudentDto.previous_license_issue_place || null;
    }
    
    if (updateStudentDto.previous_license_issue_date !== undefined) {
      student.previous_license_issue_date =
        updateStudentDto.previous_license_issue_date
          ? new Date(updateStudentDto.previous_license_issue_date)
          : null;
    }

    return this.studentRepo.save(student);
  }

  async remove(id: number) {
    const student = await this.studentRepo.findOne({
      where: { id },
      relations: ['enrollments'],
    });

    if (!student) {
      throw new NotFoundException('Không tìm thấy học viên');
    }

    if (student.enrollments && student.enrollments.length > 0) {
      throw new BadRequestException(
        'Không thể xóa học viên vì học viên đã được thêm vào khóa học',
      );
    }

    await this.studentRepo.remove(student);

    return {
      message: 'Xóa học viên thành công',
    };
  }

}

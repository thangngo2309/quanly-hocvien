import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { Course } from 'src/courses/entities/course.entity';
import { Expense } from './entities/expense.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,

    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,

    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) {}

  async create(createDto: CreateExpenseDto) {
    let enrollment: Enrollment | null = null;
    let course: Course | null = null;
  
    if (createDto.enrollment_id) {
      enrollment = await this.enrollmentRepo.findOne({
        where: { id: createDto.enrollment_id },
        relations: ['course'],
      });
  
      if (!enrollment) {
        throw new NotFoundException('Không tìm thấy học viên trong khóa');
      }
  
      if (!enrollment.course) {
        throw new BadRequestException('Học viên này chưa thuộc khóa học hợp lệ');
      }
  
      course = enrollment.course;
    } else if (createDto.course_id) {
      course = await this.courseRepo.findOne({
        where: { id: createDto.course_id },
      });
  
      if (!course) {
        throw new NotFoundException('Không tìm thấy khóa học');
      }
    } else {
      throw new BadRequestException(
        'Khoản chi phải gắn với học viên trong khóa hoặc khóa học',
      );
    }
  
    if (course.status === 'FINISHED' || course.is_finance_closed) {
      throw new BadRequestException(
        'Khóa học đã chốt thu chi hoặc đã kết thúc, không thể thêm khoản chi',
      );
    }
  
    const expense = this.expenseRepo.create({
      category_name: createDto.category_name ?? "",
      enrollment,
      course,
      amount: createDto.amount,
      expense_date: createDto.expense_date
        ? new Date(createDto.expense_date)
        : new Date(),
      payment_method: createDto.payment_method ?? undefined,
      receiver_name: createDto.receiver_name ?? undefined,
      note: createDto.note ?? undefined,
    });
  
    return this.expenseRepo.save(expense);
  }

  async findAll(filter?: { courseId?: number }) {
  const qb = this.expenseRepo
    .createQueryBuilder('expense')
    .leftJoinAndSelect('expense.course', 'course')
    .leftJoinAndSelect('expense.enrollment', 'enrollment')
    .leftJoinAndSelect('enrollment.student', 'student')
    .leftJoinAndSelect('enrollment.course', 'enrollmentCourse')
    .orderBy('expense.expense_date', 'DESC')
    .addOrderBy('expense.id', 'DESC');

  if (filter?.courseId) {
    qb.andWhere(
      new Brackets(qb1 => {
        qb1
          .where('course.id = :courseId', {
            courseId: filter.courseId,
          })
          .orWhere('enrollmentCourse.id = :courseId', {
            courseId: filter.courseId,
          });
      }),
    );
  }

  return qb.getMany();
}

  async findOne(id: number) {
    const expense = await this.expenseRepo.findOne({
      where: { id },
      relations: ['enrollment', 'enrollment.student', 'enrollment.course', 'course'],
    });

    if (!expense) {
      throw new NotFoundException('Không tìm thấy khoản chi');
    }

    return expense;
  }

  async update(id: number, updateDto: UpdateExpenseDto) {
    const expense = await this.findOne(id);

    Object.assign(expense, {
      category_name: updateDto.category_name ?? expense.category_name,
      amount: updateDto.amount ?? expense.amount,
      expense_date: updateDto.expense_date
        ? new Date(updateDto.expense_date)
        : expense.expense_date,
      payment_method: updateDto.payment_method ?? expense.payment_method,
      receiver_name: updateDto.receiver_name ?? expense.receiver_name,
      note: updateDto.note ?? expense.note,
    });

    return this.expenseRepo.save(expense);
  }

  async remove(id: number) {
    const expense = await this.findOne(id);
    return this.expenseRepo.remove(expense);
  }
}

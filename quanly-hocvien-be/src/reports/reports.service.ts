import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { Expense } from 'src/expenses/entities/expense.entity';
import { TuitionPayment } from 'src/tuition-payments/entities/tuition-payment.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,

    @InjectRepository(TuitionPayment)
    private readonly paymentRepo: Repository<TuitionPayment>,

    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
  ) {}

  async getSummary(courseId?: number) {
    const enrollmentQb = this.enrollmentRepo
      .createQueryBuilder('enrollment')
      .leftJoin('enrollment.course', 'course');

    const paymentQb = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoin('payment.enrollment', 'enrollment')
      .leftJoin('enrollment.course', 'course');

    const expenseQb = this.expenseRepo
      .createQueryBuilder('expense')
      .leftJoin('expense.enrollment', 'enrollment')
      .leftJoin('enrollment.course', 'enrollmentCourse')
      .leftJoin('expense.course', 'expenseCourse');

    if (courseId) {
      enrollmentQb.andWhere('course.id = :courseId', { courseId });

      paymentQb.andWhere('course.id = :courseId', { courseId });

      expenseQb.andWhere(
        '(enrollmentCourse.id = :courseId OR expenseCourse.id = :courseId)',
        { courseId },
      );
    }

    const tuitionResult = await enrollmentQb
      .select('COALESCE(SUM(enrollment.tuition_fee), 0)', 'total_tuition')
      .addSelect('COUNT(enrollment.id)', 'total_students')
      .getRawOne();

    const paymentResult = await paymentQb
      .select('COALESCE(SUM(payment.amount), 0)', 'total_paid')
      .getRawOne();

    const expenseResult = await expenseQb
      .select('COALESCE(SUM(expense.amount), 0)', 'total_expense')
      .getRawOne();

    const totalTuition = Number(tuitionResult.total_tuition || 0);
    const totalStudents = Number(tuitionResult.total_students || 0);
    const totalPaid = Number(paymentResult.total_paid || 0);
    const totalExpense = Number(expenseResult.total_expense || 0);

    return {
      course_id: courseId ?? null,
      total_students: totalStudents,
      total_tuition: totalTuition,
      total_paid: totalPaid,
      total_remaining: totalTuition - totalPaid,
      total_expense: totalExpense,
      profit: totalPaid - totalExpense,
    };
  }

  async getPaymentStatus(courseId?: number) {
    const where = courseId
      ? {
          course: {
            id: courseId,
          },
        }
      : {};

    const enrollments = await this.enrollmentRepo.find({
      where,
      relations: ['student', 'course', 'tuition_payments', 'expenses'],
      order: {
        id: 'DESC',
      },
    });

    return enrollments.map((enrollment) => {
      const payments = enrollment.tuition_payments ?? [];

      const firstPaid = payments
        .filter((payment) => payment.payment_round === 1)
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

      const secondPaid = payments
        .filter((payment) => payment.payment_round === 2)
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

      const totalPaid = firstPaid + secondPaid;

      const firstExpected = Number(enrollment.first_payment_expected || 0);
      const secondExpected = Number(enrollment.second_payment_expected || 0);
      const tuitionFee = Number(enrollment.tuition_fee || 0);

      return {
        enrollment_id: enrollment.id,
        student: enrollment.student
          ? {
              id: enrollment.student.id,
              full_name: enrollment.student.full_name,
              phone: enrollment.student.phone,
              date_of_birth: enrollment.student.date_of_birth,
              avatar_url: enrollment.student.avatar_url,
            }
          : null,
        course: enrollment.course
          ? {
              id: enrollment.course.id,
              name: enrollment.course.name,
              code: enrollment.course.code,
            }
          : null,
        tuition_fee: tuitionFee,
        first_payment_expected: firstExpected,
        first_payment_paid: firstPaid,
        first_payment_status: this.getPaymentStatusText(
          firstPaid,
          firstExpected,
        ),
        second_payment_expected: secondExpected,
        second_payment_paid: secondPaid,
        second_payment_status: this.getPaymentStatusText(
          secondPaid,
          secondExpected,
        ),
        total_paid: totalPaid,
        remaining_amount: tuitionFee - totalPaid,
        status: enrollment.status,
      };
    });
  }

  async getCourseProfit(courseId: number) {
    const summary = await this.getSummary(courseId);
    const students = await this.getPaymentStatus(courseId);

    return {
      ...summary,
      students,
    };
  }

  private getPaymentStatusText(paid: number, expected: number) {
    if (expected <= 0 && paid <= 0) {
      return 'UNPAID';
    }

    if (paid <= 0) {
      return 'UNPAID';
    }

    if (paid < expected) {
      return 'PARTIAL';
    }

    return 'PAID';
  }

  async getExpenseDetails(courseId?: number) {
    const qb = this.expenseRepo
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.course', 'course')
      .leftJoinAndSelect('expense.enrollment', 'enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .leftJoinAndSelect('enrollment.course', 'enrollmentCourse')
      .orderBy('expense.expense_date', 'DESC')
      .addOrderBy('expense.id', 'DESC');
  
    if (courseId) {
      qb.andWhere('course.id = :courseId', { courseId });
    }
  
    const expenses = await qb.getMany();
  
    return expenses.map(expense => ({
      id: expense.id,
      category_name: expense.category_name,
      amount: Number(expense.amount || 0),
      expense_date: expense.expense_date,
      payment_method: expense.payment_method,
      receiver_name: expense.receiver_name,
      note: expense.note,
      target_type: expense.enrollment ? 'ENROLLMENT' : 'COURSE',
      course: expense.course
        ? {
            id: expense.course.id,
            name: expense.course.name,
            code: expense.course.code,
          }
        : null,
      student: expense.enrollment?.student
        ? {
            id: expense.enrollment.student.id,
            full_name: expense.enrollment.student.full_name,
            phone: expense.enrollment.student.phone,
          }
        : null,
    }));
  }
}

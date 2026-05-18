import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTuitionPaymentDto } from './dto/create-tuition-payment.dto';
import { UpdateTuitionPaymentDto } from './dto/update-tuition-payment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TuitionPayment } from './entities/tuition-payment.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TuitionPaymentsService {
  constructor(
    @InjectRepository(TuitionPayment)
    private readonly paymentRepo: Repository<TuitionPayment>,

    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
  ) {}

  async create(createDto: CreateTuitionPaymentDto) {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: createDto.enrollment_id },
      relations: [
        'course',
        'student',
        'student.exam_histories',
        'tuition_payments',
      ],    
    });

    if (!enrollment) {
      throw new NotFoundException('Không tìm thấy học viên trong khóa');
    }

    if (enrollment.course?.status === 'FINISHED' || enrollment.course?.is_finance_closed) {
      throw new BadRequestException(
        'Khóa học đã chốt thu chi hoặc đã kết thúc, không thể thu thêm học phí',
      );
    }
    
    const hasPassedExam = enrollment.student?.exam_histories?.some(
      exam => exam.result === 'PASSED',
    );
    
    if (hasPassedExam) {
      throw new BadRequestException(
        'Học viên đã thi đậu, không thể đóng thêm học phí',
      );
    }
    
    const totalPaid = (enrollment.tuition_payments || []).reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );
    
    const tuitionFee = Number(enrollment.tuition_fee || 0);
    
    if (totalPaid >= tuitionFee) {
      throw new BadRequestException(
        'Học viên đã đóng đủ học phí, không thể đóng thêm',
      );
    }
    
    if (totalPaid + Number(createDto.amount || 0) > tuitionFee) {
      throw new BadRequestException(
        'Số tiền đóng vượt quá học phí còn lại của học viên',
      );
    }

    // const existed = await this.paymentRepo.findOne({
    //   where: {
    //     enrollment: { id: createDto.enrollment_id },
    //     payment_round: createDto.payment_round,
    //   },
    // });

    // if (existed) {
    //   throw new BadRequestException(
    //     `Học viên đã có bản ghi đóng học phí lần ${createDto.payment_round}`,
    //   );
    // }

    const payment = this.paymentRepo.create({
      enrollment,
      payment_round: createDto.payment_round,
      amount: createDto.amount,
      payment_date: createDto.payment_date
        ? new Date(createDto.payment_date)
        : new Date(),
      payment_method: createDto.payment_method,
      note: createDto.note,
    });

    return this.paymentRepo.save(payment);
  }

  findAll() {
    return this.paymentRepo.find({
      relations: ['enrollment', 'enrollment.student', 'enrollment.course'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const payment = await this.paymentRepo.findOne({
      where: { id },
      relations: ['enrollment', 'enrollment.student', 'enrollment.course'],
    });

    if (!payment) {
      throw new NotFoundException('Không tìm thấy bản ghi đóng học phí');
    }

    return payment;
  }

  async update(id: number, updateDto: UpdateTuitionPaymentDto) {
    const payment = await this.findOne(id);

    Object.assign(payment, {
      payment_round: updateDto.payment_round ?? payment.payment_round,
      amount: updateDto.amount ?? payment.amount,
      payment_date: updateDto.payment_date
        ? new Date(updateDto.payment_date)
        : payment.payment_date,
      payment_method: updateDto.payment_method ?? payment.payment_method,
      note: updateDto.note ?? payment.note,
    });

    return this.paymentRepo.save(payment);
  }

  async remove(id: number) {
    const payment = await this.findOne(id);
    return this.paymentRepo.remove(payment);
  }
}

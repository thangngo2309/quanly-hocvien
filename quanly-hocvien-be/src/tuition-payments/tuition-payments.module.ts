import { Module } from '@nestjs/common';
import { TuitionPaymentsService } from './tuition-payments.service';
import { TuitionPaymentsController } from './tuition-payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TuitionPayment } from './entities/tuition-payment.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TuitionPayment, Enrollment])],
  controllers: [TuitionPaymentsController],
  providers: [TuitionPaymentsService],
  exports: [TuitionPaymentsService, TypeOrmModule],
})
export class TuitionPaymentsModule {}

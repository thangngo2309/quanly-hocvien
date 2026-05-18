import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { TuitionPayment } from 'src/tuition-payments/entities/tuition-payment.entity';
import { Expense } from 'src/expenses/entities/expense.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Enrollment,
      TuitionPayment,
      Expense,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService]
})
export class ReportsModule {}

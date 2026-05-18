import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { StudentsModule } from './students/students.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { TuitionPaymentsModule } from './tuition-payments/tuition-payments.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ReportsModule } from './reports/reports.module';
import { ExamHistoriesModule } from './exam-histories/exam-histories.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env", // tự load file .env
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DATABASE_HOST, // hoặc IP của database server
      port: process.env.DATABASE_PORT ? +process.env.DATABASE_PORT : 5432,
      username: process.env.DATABASE_USER
        ? process.env.DATABASE_USER
        : "postgres",
      password: process.env.DATABASE_PASSWORD
        ? process.env.DATABASE_PASSWORD
        : "P@ssw0rd",
      database: process.env.DATABASE_NAME,
      entities: [],
      autoLoadEntities: true,
      synchronize: true,
    }),
    StudentsModule,
    CoursesModule,
    EnrollmentsModule,
    TuitionPaymentsModule,
    ExpensesModule,
    ReportsModule,
    ExamHistoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

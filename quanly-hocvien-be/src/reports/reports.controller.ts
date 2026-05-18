import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('course-profit')
  getCourseProfit(@Query('course_id') courseId: string) {
    return this.reportsService.getCourseProfit(Number(courseId));
  }

  @Get('summary')
  getSummary(
    @Query('course_id') courseId?: string,
    @Query('student_id') studentId?: string,
  ) {
    return this.reportsService.getSummary({
      courseId: courseId ? Number(courseId) : undefined,
      studentId: studentId ? Number(studentId) : undefined,
    });
  }

  @Get('payment-status')
  getPaymentStatus(
    @Query('course_id') courseId?: string,
    @Query('student_id') studentId?: string,
  ) {
    return this.reportsService.getPaymentStatus({
      courseId: courseId ? Number(courseId) : undefined,
      studentId: studentId ? Number(studentId) : undefined,
    });
  }

  @Get('expense-details')
  getExpenseDetails(
    @Query('course_id') courseId?: string,
    @Query('student_id') studentId?: string,
  ) {
    return this.reportsService.getExpenseDetails({
      courseId: courseId ? Number(courseId) : undefined,
      studentId: studentId ? Number(studentId) : undefined,
    });
  }
}

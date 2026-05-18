import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  getSummary(@Query('course_id') courseId?: string) {
    return this.reportsService.getSummary(
      courseId ? Number(courseId) : undefined,
    );
  }

  @Get('payment-status')
  getPaymentStatus(@Query('course_id') courseId?: string) {
    return this.reportsService.getPaymentStatus(
      courseId ? Number(courseId) : undefined,
    );
  }

  @Get('course-profit')
  getCourseProfit(@Query('course_id') courseId: string) {
    return this.reportsService.getCourseProfit(Number(courseId));
  }

  @Get('expense-details')
  getExpenseDetails(@Query('course_id') courseId?: string) {
    return this.reportsService.getExpenseDetails(
      courseId ? Number(courseId) : undefined,
    );
  }
}

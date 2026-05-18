import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TuitionPaymentsService } from './tuition-payments.service';
import { CreateTuitionPaymentDto } from './dto/create-tuition-payment.dto';
import { UpdateTuitionPaymentDto } from './dto/update-tuition-payment.dto';

@Controller('tuition-payments')
export class TuitionPaymentsController {
  constructor(private readonly tuitionPaymentsService: TuitionPaymentsService) {}

  @Post()
  create(@Body() createTuitionPaymentDto: CreateTuitionPaymentDto) {
    return this.tuitionPaymentsService.create(createTuitionPaymentDto);
  }

  @Get()
  findAll() {
    return this.tuitionPaymentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tuitionPaymentsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTuitionPaymentDto: UpdateTuitionPaymentDto) {
    return this.tuitionPaymentsService.update(+id, updateTuitionPaymentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tuitionPaymentsService.remove(+id);
  }
}

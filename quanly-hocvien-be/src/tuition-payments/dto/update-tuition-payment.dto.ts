import { PartialType } from '@nestjs/mapped-types';
import { CreateTuitionPaymentDto } from './create-tuition-payment.dto';

export class UpdateTuitionPaymentDto extends PartialType(CreateTuitionPaymentDto) {}

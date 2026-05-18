import { PartialType } from '@nestjs/mapped-types';
import { CreateExamHistoryDto } from './create-exam-history.dto';

export class UpdateExamHistoryDto extends PartialType(CreateExamHistoryDto) {}

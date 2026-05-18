import { IsDateString, IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { ExamResult, ExamType } from "../entities/exam-history.entity";

export class CreateExamHistoryDto {
  @IsInt()
  student_id: number;

  @IsEnum(ExamType)
  exam_type: ExamType;

  @IsOptional()
  @IsDateString()
  exam_date?: string;

  @IsEnum(ExamResult)
  result: ExamResult;

  @IsOptional()
  @IsDateString()
  retake_date?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
